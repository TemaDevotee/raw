const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const dir = path.join(root, '.mockdb');
const dbPath = path.join(root, 'mock_backend', 'db.json');

const idx = process.argv.indexOf('--name');
const name = idx !== -1 ? process.argv[idx + 1] : '';
if (!name) {
  console.error('usage: node load.js --name <snapshot>');
  process.exit(1);
}
const src = path.join(dir, `${name}.json`);
if (!fs.existsSync(src)) {
  console.error('snapshot not found');
  process.exit(1);
}
const active = path.join(dir, 'current.json');
fs.copyFileSync(src, active);
fs.copyFileSync(src, dbPath);
console.log('snapshot loaded', name);
