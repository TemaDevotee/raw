const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const dir = path.join(root, '.mockdb');

const items = fs
  .readdirSync(dir, { withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith('.json') && e.name !== 'current.json')
  .map((e) => {
    const stat = fs.statSync(path.join(dir, e.name));
    return {
      name: path.basename(e.name, '.json'),
      size: stat.size,
      mtime: stat.mtime.toISOString(),
    };
  });
console.log(JSON.stringify({ items }, null, 2));
