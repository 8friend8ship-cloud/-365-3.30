import fs from 'fs';
const items = JSON.parse(fs.readFileSync('items.json', 'utf8'));
console.log(JSON.stringify(items[0], null, 2));
