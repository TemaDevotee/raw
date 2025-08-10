import { test } from '@playwright/test'
import './__setup__'
import {
  seedAppState,
  seedDrafts,
  discardDraft,
  waitForDraftCount,
  waitStoreOp,
  waitForAppReady,
} from './utils/session'
import { gotoHash } from './support/nav'

test.beforeEach(async ({ page }) => {
  await seedAppState(page)
})

test('draft discard removes bubble', async ({ page }) => {
  const chatId = '6'
  await seedDrafts(page, chatId, ['temp msg'])
  await gotoHash(page, `chats/${chatId}`)
  await waitForAppReady(page)
  await page.getByTestId('chat-window').waitFor()
  await waitForDraftCount(page, 1)
  const draftId = 'e2e-draft-0'
  const waitOp = waitStoreOp(page, 'discard', draftId)
  await discardDraft(page, draftId)
  await waitOp
  await waitForDraftCount(page, 0)
})
