const fs = require('fs');
const filepath = 'c:\\Users\\opd\\Desktop\\last_product3\\stock_dbcenter\\src\\pages\\repair\\RepairEntry.tsx';
const lines = fs.readFileSync(filepath, 'utf-8').split('\n');

let out = [];
let state = 'KEEP';
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('<<<<<<< ')) {
        state = 'KEEP';
        continue;
    } else if (line.startsWith('=======')) {
        state = 'SKIP';
        continue;
    } else if (line.startsWith('>>>>>>> ')) {
        state = 'KEEP';
        continue;
    }
    if (state === 'KEEP') {
        out.push(line);
    }
}
fs.writeFileSync(filepath, out.join('\n'), 'utf-8');
