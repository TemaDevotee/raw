import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('login page renders and app loads', async ({ page }) => {
  await page.goto('/login.html', { waitUntil: 'domcontentloaded' });
  await page.locator('form').waitFor();
  await expect(page.locator('form')).toBeVisible();
  await page.goto('/#/chats?skipAuth=1', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('sidebar').waitFor();
  await expect(page.getByTestId('sidebar')).toBeVisible();
});
