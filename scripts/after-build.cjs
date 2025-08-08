// scripts/after-build.cjs
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'dist', 'index.html');
const dest = path.join(__dirname, '..', 'dist', '404.html');

try {
  fs.copyFileSync(src, dest);
  console.log('✅ Created dist/404.html for SPA fallback');
} catch (e) {
  console.error('❌ Could not create 404.html:', e.message);
  process.exit(1);
}
