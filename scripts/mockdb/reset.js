const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const dbPath = path.join(root, 'mock_backend', 'db.json');
const backupPath = path.join(root, 'mock_backend', 'db.json.backup');

if (!fs.existsSync(backupPath)) {
  console.error('backup not found');
  process.exit(1);
}
fs.copyFileSync(backupPath, dbPath);
require('./save');
console.log('mock db reset');
