import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState, seedDrafts } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('draft discard removes bubble', async ({ page }) => {
  await seedDrafts(page, {
    '6': [
      { id: 'd601', chatId: '6', author: 'agent', text: 'temp msg', createdAt: Date.now(), state: 'queued' },
    ],
  });
  await gotoHash(page, 'chats/6');
  await waitForAppReady(page);
  await page.getByTestId('draft-bubble').waitFor();
  await page.getByTestId('draft-discard').click();
  await expect(page.getByTestId('draft-bubble')).toBeHidden();
  await expect(page.getByText('temp msg')).toHaveCount(0);
});
