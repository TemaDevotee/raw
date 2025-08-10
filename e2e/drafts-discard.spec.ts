import { test, expect } from '@playwright/test'
import './__setup__'
import {
  seedAppState,
  seedDrafts,
  discardDraft,
  waitStoreOp,
  waitDraftCountServer,
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
  await waitDraftCountServer(page, chatId, 1)
  const draftId = 'e2e-draft-0'
  const waitOp = waitStoreOp(page, 'discard', draftId)
  await discardDraft(page, draftId)
  await waitOp.catch(() => {})
  await waitDraftCountServer(page, chatId, 0)
  await expect(page.getByTestId('msg-agent').last()).not.toHaveText('temp msg')
})
