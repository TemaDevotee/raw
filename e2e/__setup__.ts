import { test as base } from '@playwright/test';

base.beforeEach(async ({ page }) => {
  page.on('console', (m) => console.log('[BROWSER]', m.type(), m.text()));
  page.on('pageerror', (e) => console.log('[PAGEERROR]', e.message));
});
