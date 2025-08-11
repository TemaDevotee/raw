import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState, waitForAppReady } from './utils/session'
import { seedDraft, waitForDraftOp } from './_/helpers/drafts'
import { gotoHash } from './support/nav'

test.beforeEach(async ({ page }) => {
  await seedAppState(page)
})

test('draft discard removes bubble', async ({ page }) => {
  const chatId = '6'
  await seedDraft(page, chatId, { id: 'd1', text: 'temp msg' })
  await gotoHash(page, `chats/${chatId}`)
  await waitForAppReady(page)
  await expect(page.getByTestId('drafts')).toHaveAttribute('data-count', '1')
  const bubble = page.getByTestId('draft').first()
  await expect(bubble).toBeVisible()
  const draftId = await bubble.getAttribute('data-draft-id')
  await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/api/chats/${chatId}/drafts/${draftId}/discard`) && r.ok()),
    waitForDraftOp(page, chatId, draftId!, 'discard'),
    bubble.getByTestId('draft-discard').click(),
  ])
  await expect(page.getByTestId('drafts')).toHaveAttribute('data-count', '0')
  await expect(page.getByText('temp msg')).toHaveCount(0)
})
