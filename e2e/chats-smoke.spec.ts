import { test, expect } from '@playwright/test';
import './__setup__';

test('renders chat list with groups and rows', async ({ page }) => {
  await page.goto('/chats');
  await expect(page.getByTestId('chats-view')).toBeVisible();
  await expect(page.getByTestId('group-live')).toBeVisible();
  await expect(page.locator('[data-testid^="chat-row-"]').first()).toBeVisible();
});

test('filters by agent name', async ({ page }) => {
  await page.goto('/chats');
  const input = page.getByPlaceholder('Search by customer, ID, agent');
  await input.fill('guzzi');
  await page.waitForTimeout(300);
  const badge = page.locator('[data-testid^="chat-row-"]').first().getByTestId('agent-badge');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute('title', /guzzi/i);
});

test('chat row shows agent badge', async ({ page }) => {
  await page.goto('/chats');
  const row = page.locator('[data-testid^="chat-row-"]').first();
  const badge = row.getByTestId('agent-badge');
  await expect(badge).toBeVisible();
  const boxRow = await row.boundingBox();
  const boxBadge = await badge.boundingBox();
  expect(boxBadge!.x).toBeGreaterThan(boxRow!.x);
  expect(boxBadge!.y).toBeGreaterThan(boxRow!.y);
});
