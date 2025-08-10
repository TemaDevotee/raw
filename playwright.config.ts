import { defineConfig } from '@playwright/test';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: base,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: {
    command: 'npm run dev:e2e',
    url: base,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
