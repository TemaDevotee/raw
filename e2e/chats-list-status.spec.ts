import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('shows human status labels and no assign-to-me filter', async ({ page }) => {
  await gotoHash(page, 'chats');
  await waitForAppReady(page);

  await expect(page.getByTestId('group-live')).toContainText('В эфире');
  await expect(page.getByTestId('group-attention')).toContainText('Требует внимания');
  await expect(page.getByTestId('group-paused')).toContainText('На паузе');
  await expect(page.getByTestId('group-resolved')).toContainText('Решён');
  await expect(page.getByTestId('group-idle')).toContainText('Неактивен');

  await expect(page.getByTestId('filter-mine')).toHaveCount(0);
});
