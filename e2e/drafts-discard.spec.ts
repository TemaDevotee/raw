import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState, seedDrafts } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady, waitForDraftCount, waitForBadgeCount } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('draft discard removes bubble', async ({ page }) => {
  await seedDrafts(page, '6', ['temp msg'])
  await gotoHash(page, 'chats/6')
  await waitForAppReady(page)
  await page.getByTestId('chat-window').waitFor()
  await waitForDraftCount(page, 1)
  const discard = page.getByTestId('draft-discard').first()
  await Promise.all([
    page.waitForResponse(/drafts\/.*\/discard/),
    discard.click()
  ])
  await waitForDraftCount(page, 0)
  await waitForBadgeCount(page, 0)
  await expect(page.getByTestId('msg-agent').filter({ hasText: 'temp msg' })).toHaveCount(0)
})
