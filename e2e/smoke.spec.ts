import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('app shell renders', async ({ page }) => {
  await gotoHash(page, 'chats');
  await waitForAppReady(page);
  await page.getByTestId('sidebar').waitFor();
  await expect(page.getByTestId('sidebar')).toBeVisible();
});
