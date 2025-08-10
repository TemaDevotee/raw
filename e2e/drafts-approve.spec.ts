import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState, seedDrafts } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady, waitForDraftCount, waitForBadgeCount } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('draft approval publishes message', async ({ page }) => {
  await seedDrafts(page, '5', ['hello from agent'])
  await gotoHash(page, 'chats/5')
  await waitForAppReady(page)
  await page.getByTestId('chat-window').waitFor()
  await waitForDraftCount(page, 1)
  const approve = page.getByTestId('draft-approve').first()
  await Promise.all([
    page.waitForResponse(/drafts\/.*\/approve/),
    approve.click()
  ])
  await waitForDraftCount(page, 0)
  await expect(page.getByTestId('msg-agent').filter({ hasText: 'hello from agent' })).toBeVisible()
  await waitForBadgeCount(page, 0)
})
