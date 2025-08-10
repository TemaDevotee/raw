import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState, seedDrafts } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('draft approval publishes message', async ({ page }) => {
  await seedDrafts(page, {
    '5': [
      { id: 'd501', chatId: '5', author: 'agent', text: 'hello from agent', createdAt: Date.now(), state: 'queued' },
    ],
  });
  await gotoHash(page, 'chats/5');
  await waitForAppReady(page);
  await page.getByTestId('draft-bubble').waitFor();
  await page.getByTestId('draft-approve').click();
  await expect(page.getByTestId('draft-bubble')).toBeHidden();
  await expect(page.getByText('hello from agent')).toBeVisible();
});
