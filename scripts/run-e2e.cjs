try {
  require.resolve('@playwright/test');
} catch (e) {
  console.log('E2E skipped (Playwright not available)');
  process.exit(0);
}
const { spawn } = require('child_process');
const proc = spawn('playwright', ['test'], { stdio: 'inherit' });
proc.on('close', (code) => process.exit(code));
