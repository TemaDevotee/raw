import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady, waitForDraftCount, waitForBadgeCount } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('draft approval publishes message', async ({ page }) => {
  await gotoHash(page, 'chats/5');
  await waitForAppReady(page);
  await page.getByTestId('chat-window').waitFor();
  await page.waitForFunction(() => !window.__draftStoreState.loadingByChat['5']);
  await page.evaluate(() => {
    window.__e2e_addDraft({ chatId: '5', text: 'hello from agent' });
  });
  await waitForDraftCount(page, 1);
  await page.getByTestId('draft-approve').click();
  await waitForDraftCount(page, 0);
  await expect(page.getByTestId('msg-agent').filter({ hasText: 'hello from agent' })).toBeVisible();
  await waitForBadgeCount(page, 0);
});
