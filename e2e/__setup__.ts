import { test as base } from '@playwright/test';
import { wire404Debug } from './support/log';

base.beforeEach(async ({ page }) => {
  wire404Debug(page);
  page.on('pageerror', (e) => console.log('[PAGEERROR]', e.message));
});
