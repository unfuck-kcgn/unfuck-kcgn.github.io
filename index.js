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
        return [parseInt(t[0]),parseInt(t[1])];
    }).sort((a,b) => b[1]-a[1]);
    const parsedKts = (new DOMParser()).parseFromString(ktsFile, 'text/xml');
    const currentRound = parseInt(parsedKts.querySelector('CurrentRound').textContent);
    const foundTables = new Set();
    parsedKts.querySelectorAll('Matches > TournMatch').forEach((match) => {
        const round = parseInt(match.querySelector('Round').textContent);
        if (round !== currentRound) return;

        let tableElm = match.querySelector('Table');
        const oldTable = parseInt(tableElm.textContent);
        let newTable = oldTable;
        for (const [fixedSeatPos, fixedSeat] of assignedTables) {
            if (oldTable === fixedSeatPos) {
                newTable = fixedSeat;
                break;
            } else {
                if (newTable <= fixedSeat) newTable -= 1;
            }
        }
        console.log('Round',round,'Table',oldTable,'now becomes',newTable);
        const ident = JSON.stringify({round,newTable});
        if (foundTables.has(ident)) {
            window.alert('Duplicate reassigned table. Something has gone wrong.');
            return;
        }
        foundTables.add(ident);
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
