const fs = require('fs');
const path = require('path');

const root = path.resolve('apps/mock-backend');
const patterns = [
  /\sas\s+(any|string|boolean|number)\b/,
  /\bimport\s+type\b/,
  /<[A-Za-z][A-Za-z0-9_<> ,]*>\s*\(/,
];

let failed = false;

function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(full);
    } else if (entry.isFile() && full.endsWith('.js')) {
      const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
      lines.forEach((line, idx) => {
        for (const pat of patterns) {
          if (pat.test(line)) {
            console.error(`${full}:${idx + 1}: ${line.trim()}`);
            failed = true;
          }
        }
      });
    }
  }
}

scan(root);
if (failed) {
  process.exit(1);
}
