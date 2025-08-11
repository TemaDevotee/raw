import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState, waitForAppReady } from './utils/session'
import { seedDraft } from './_/helpers/drafts'
import { gotoHash } from './support/nav'

test('draft approval publishes message', async ({ page }) => {
  const chatId = '5'
  await seedAppState(page, { chats: { [chatId]: { id: chatId, messages: [], status: 'live' } } })
  await seedDraft(page, chatId, { id: 'd1', text: 'hello from agent' })
  await gotoHash(page, `chats/${chatId}`)
  await waitForAppReady(page)
  await expect(page.getByTestId('drafts')).toHaveAttribute('data-count', '1')
  const draftId = await page.locator('[data-testid="draft"]').first().getAttribute('data-draft-id')
  const before = await page.evaluate(() => (window as any).__draft_op_done__ || 0)
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().includes(`/api/chats/${chatId}/drafts/${draftId}/approve`) &&
      r.request().method() === 'POST' &&
      r.ok(),
  )
  await page.locator(`[data-draft-id="${draftId}"] [data-testid="draft-approve"]`).click()
  const res = await responsePromise
  console.log('approve status', res.status())
  await page.waitForFunction((prev) => (window as any).__draft_op_done__ > prev, before)
  await expect(page.locator(`[data-draft-id="${draftId}"]`)).toHaveCount(0)
  await expect(page.getByTestId('drafts')).toHaveAttribute('data-count', '0')
  await expect(page.getByTestId('msg-agent').last()).toContainText('hello from agent')
})
