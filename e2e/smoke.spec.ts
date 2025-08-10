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

  await gotoHash(page, 'account');
  await waitForAppReady(page);
  const card = page.getByTestId('billing-card');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Pro');
  await expect(card).toContainText('34,850');
  await expect(card).toContainText('200,000');
  await expect(page.getByTestId('billing-progress')).toHaveAttribute('role', 'progressbar');
});
