const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dbPath = path.join(root, 'mock_backend', 'db.json');
const backupPath = path.join(root, 'mock_backend', 'db.json.backup');
const storeDir = path.join(root, '.mockdb');
const exportDir = path.join(storeDir, 'exports');

function ensure(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function save() {
  ensure(storeDir);
  fs.copyFileSync(dbPath, path.join(storeDir, 'db.json'));
  console.log('mock db saved');
}

function reset() {
  if (!fs.existsSync(backupPath)) {
    console.error('backup not found');
    process.exit(1);
  }
  fs.copyFileSync(backupPath, dbPath);
  console.log('mock db reset');
  save();
}

function exportDb() {
  save();
  ensure(exportDir);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(exportDir, `db-${stamp}.json`);
  fs.copyFileSync(dbPath, dest);
  console.log('mock db exported to', dest);
}

const cmd = process.argv[2];
switch (cmd) {
  case 'save':
    save();
    break;
  case 'reset':
    reset();
    break;
  case 'export':
    exportDb();
    break;
  default:
    console.log('usage: node scripts/mockdb.js [save|reset|export]');
    process.exit(1);
}
