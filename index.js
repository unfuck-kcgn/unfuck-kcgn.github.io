const downloadFile = ((mimeType, filename, fileContent) => {
    const a = document.createElement('a');
    a.setAttribute('href', 'data:'+mimeType+'; charset=utf-8,'+encodeURIComponent(fileContent));
    a.setAttribute('download', filename);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

const parseAndDownload = ((filename, ktsFile, kcgnAssigned) => {
    const assignedTables = kcgnAssigned.split('\n').map((s) => {
        const t = s.split(',');
        return [parseInt(t[1]),parseInt(t[2])];
    }).sort((a,b) => a[0]-b[0]);
    const parsedKts = (new DOMParser()).parseFromString(ktsFile, 'text/xml');
    //const foundTables = new Set();
    parsedKts.querySelectorAll('Matches > TournMatch').forEach((match) => {
        const players = [...(match.querySelectorAll('Player'))].map((e) => parseInt(e.textContent));
        const round = match.querySelector('Round').textContent;
        let tableElm = match.querySelector('Table');
        const oldTable = parseInt(tableElm.textContent);
        let newTable = oldTable;
        for (const [fixedSeat, fixedPlayer] of assignedTables) {
            if (players.some((it) => (it === fixedPlayer))) {
                newTable = fixedSeat;
                break;
            } else {
                if (newTable <= fixedSeat) newTable += 1;
            }
        }
        console.log('Round',round,'Table',oldTable,'now becomes',newTable);
        /*if (foundTables.has(newTable)) {
            window.alert('Duplicate reassigned table. Something has gone wrong.');
            return;
        }
        foundTables.add(newTable);*/
        tableElm.textContent = (''+newTable);
    });
    const serializedKts = (new XMLSerializer()).serializeToString(parsedKts);
    
    downloadFile(
        'text/xml',
        filename.replaceAll('.Tournament','_fixed.Tournament'),
        serializedKts
    );
});

document.getElementById('select-file').addEventListener('change', function() {
    if (!this.files.length) return;
    const reader = new FileReader();
    reader.fileName = this.files[0].name;
    reader.addEventListener('load',() => {
        const ktsFile = reader.result;
        const kcgnAssigned = document.getElementById('fixed-seatings').value;
        parseAndDownload(reader.fileName, ktsFile, kcgnAssigned);
    });
    reader.readAsText(this.files[0]);
    this.value = '';
});
