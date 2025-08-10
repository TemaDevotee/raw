import { test } from '@playwright/test'
import './__setup__'
import {
  seedAppState,
  seedDrafts,
  approveDraft,
  waitForAgentMessage,
  waitStoreOp,
  waitDraftCountServer,
  waitForAppReady,
} from './utils/session'
import { gotoHash } from './support/nav'

test.beforeEach(async ({ page }) => {
  await seedAppState(page)
})

test('draft approval publishes message', async ({ page }) => {
  const chatId = '5'
  await seedDrafts(page, chatId, ['hello from agent'])
  await gotoHash(page, `chats/${chatId}`)
  await waitForAppReady(page)
  await page.getByTestId('chat-window').waitFor()
  await waitDraftCountServer(page, chatId, 1)
  const draftId = 'e2e-draft-0'
  const waitOp = waitStoreOp(page, 'approve', draftId)
  await approveDraft(page, draftId)
  await waitOp.catch(() => {})
  await waitDraftCountServer(page, chatId, 0)
  await waitForAgentMessage(page, 'hello from agent')
})
