import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState, waitForAppReady } from './utils/session'
import { clickDraftAction, waitDraftMutation } from './_/helpers/drafts'
import { gotoHash } from './support/nav'

test('draft discard removes bubble', async ({ page }) => {
  const chatId = '6'
  await seedAppState(page, {
    chats: { [chatId]: { id: chatId, messages: [], status: 'live' } },
    drafts: { [chatId]: [{ id: 'd1', text: 'temp msg' }] },
  })
  await gotoHash(page, `chats/${chatId}`)
  await waitForAppReady(page)
  await expect(page.locator('[data-test="drafts"]')).toHaveAttribute('data-count', '1')
  await Promise.all([
    waitDraftMutation(page, 'discard', { chatId, draftId: 'd1' }),
    clickDraftAction(page, 'discard', 'd1'),
  ])
  await expect(page.locator('[data-test="drafts"]')).toHaveAttribute('data-count', '0')
  await expect(page.getByText('temp msg')).toHaveCount(0)
})
