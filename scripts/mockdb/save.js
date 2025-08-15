const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const dbPath = path.join(root, 'mock_backend', 'db.json');
const active = path.join(root, '.mockdb', 'current.json');

function ensure(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensure(path.dirname(active));
fs.copyFileSync(dbPath, active);
console.log('mock db saved to', active);
