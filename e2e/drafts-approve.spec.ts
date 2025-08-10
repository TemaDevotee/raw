import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState, seedDrafts, waitForAppReady } from './utils/session'
import { approveDraft } from './_/helpers/drafts'
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
  const draftId = 'd-e2e-1'
  await expect(page.locator(`[data-draft-id="${draftId}"]`)).toBeVisible()
  const before = await page.locator('[data-testid="msg-agent"]').count()
  await approveDraft(page, draftId)
  await expect(page.locator(`[data-draft-id="${draftId}"]`)).toHaveCount(0)
  await expect(page.locator('[data-testid="msg-agent"]')).toHaveCount(before + 1)
  await expect(page.getByTestId('msg-agent').last()).toHaveText('hello from agent')
})
