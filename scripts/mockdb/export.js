const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const active = path.join(root, '.mockdb', 'current.json');
const exportDir = path.join(root, '.mockdb', 'exports');

function ensure(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensure(exportDir);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dest = path.join(exportDir, `db-${stamp}.json`);
fs.copyFileSync(active, dest);
console.log('mock db exported to', dest);
