import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState, waitForAppReady } from './utils/session';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('app shell renders', async ({ page }) => {
  await page.goto('/#/chats?skipAuth=1');
  await waitForAppReady(page);
  await page.getByTestId('sidebar').waitFor();
  await expect(page.getByTestId('sidebar')).toBeVisible();
});
