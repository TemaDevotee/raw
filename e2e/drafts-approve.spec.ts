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
  await expect(page.getByTestId('drafts-container')).toHaveAttribute('data-count', '1')
  const bubble = page.getByTestId('draft').first()
  await expect(bubble).toBeVisible()
  const draftId = await bubble.getAttribute('data-draft-id')
  const before = await page.evaluate(() => (window as any).__draft_op_done__ || 0)
  await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes(`/api/chats/${chatId}/drafts/${draftId}/approve`) &&
        r.request().method() === 'POST' &&
        r.ok(),
    ),
    page.waitForFunction((prev) => (window as any).__draft_op_done__ === prev + 1, before),
    bubble.getByTestId('draft-approve').click(),
  ])
  await page.waitForSelector(`[data-testid="draft"][data-draft-id="${draftId}"]`, { state: 'detached' })
  await expect(page.getByTestId('drafts-container')).toHaveAttribute('data-count', '0')
  await expect(page.getByText('hello from agent')).toBeVisible()
})
