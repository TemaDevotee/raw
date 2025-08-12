import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState, waitForAppReady } from './utils/session'
import { seedDraft, clickDraftAction, waitDraftMutation } from './_/helpers/drafts'
import { gotoHash } from './support/nav'

test('draft approval publishes message', async ({ page }) => {
  const chatId = '5'
  await seedAppState(page, { chats: { [chatId]: { id: chatId, messages: [], status: 'live' } } })
  const draft = await seedDraft(page, chatId, { text: 'hello from agent' })
  await gotoHash(page, `chats/${chatId}`)
  await waitForAppReady(page)
  await expect(page.locator('[data-test="drafts"]')).toHaveAttribute('data-count', '1')
  await Promise.all([
    waitDraftMutation(page, 'approve', { chatId, draftId: draft.id }),
    clickDraftAction(page, 'approve', draft.id),
  ])
  await expect(page.locator('[data-test="drafts"]')).toHaveAttribute('data-count', '0')
  await expect(page.getByTestId('msg-agent').last()).toContainText('hello from agent')
})
