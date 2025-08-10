import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('renders chat list with groups and rows', async ({ page }) => {
  await gotoHash(page, 'chats');
  await waitForAppReady(page);
  await page.getByTestId('chats-groups').waitFor();
  await expect(page.getByTestId('chats-view')).toBeVisible();
  const groups = page.getByTestId('chats-groups');
  await expect(groups).toBeVisible();
  const anyRow = page.locator('[data-testid^="chat-row-"]').first();
  await expect.soft(anyRow.or(page.getByTestId('chats-empty'))).toBeVisible();
});

test('collapsing and expanding groups works', async ({ page }) => {
  await gotoHash(page, 'chats');
  await waitForAppReady(page);
  await page.getByTestId('group-attention').waitFor();
  const group = page.getByTestId('group-attention');
  const row = page.getByTestId('chat-row-1');
  await expect(row).toBeVisible();
  await group.click();
  await expect(row).not.toBeVisible();
  await group.click();
  await expect(row).toBeVisible();
});
