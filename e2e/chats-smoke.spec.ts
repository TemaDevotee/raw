import { test, expect } from '@playwright/test';
import './__setup__';

test('renders chat list with groups and rows', async ({ page }) => {
  await page.goto('/chats');
  await expect(page.getByTestId('chats-view')).toBeVisible();
  await expect(page.getByTestId('group-live')).toBeVisible();
  await expect(page.locator('[data-testid^="chat-row-"]').first()).toBeVisible();
});
