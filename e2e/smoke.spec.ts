import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('app shell renders', async ({ page }) => {
  await page.goto('/#/chats?skipAuth=1', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid-app-ready="1"]');
  await page.getByTestId('sidebar').waitFor();
  await expect(page.getByTestId('sidebar')).toBeVisible();
});
