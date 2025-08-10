import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady, waitForDraftCount, waitForBadgeCount } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('draft discard removes bubble', async ({ page }) => {
  await gotoHash(page, 'chats/6');
  await waitForAppReady(page);
  await page.getByTestId('chat-window').waitFor();
  await page.waitForFunction(() => !window.__draftStoreState.loadingByChat['6']);
  await page.evaluate(() => {
    window.__e2e_addDraft({ chatId: '6', text: 'temp msg' });
  });
  await waitForDraftCount(page, 1);
  await page.getByTestId('draft-discard').click();
  await waitForDraftCount(page, 0);
  await waitForBadgeCount(page, 0);
  await expect(page.getByTestId('msg-agent').filter({ hasText: 'temp msg' })).toHaveCount(0);
});
