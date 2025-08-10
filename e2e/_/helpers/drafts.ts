import { Page } from '@playwright/test'

export async function approveDraft(page: Page, draftId: string) {
  const before = await page.evaluate(() => (window as any).__draft_op_done__ ?? 0)
  await Promise.all([
    page.waitForResponse(r =>
      r.url().includes(`/drafts/${draftId}/approve`) && r.status() === 200
    ),
    page.locator(`[data-draft-id="${draftId}"] [data-testid="draft-approve"]`).click(),
  ])
  await page.waitForFunction(prev => (window as any).__draft_op_done__ === prev + 1, before)
}

export async function discardDraft(page: Page, draftId: string) {
  const before = await page.evaluate(() => (window as any).__draft_op_done__ ?? 0)
  await Promise.all([
    page.waitForResponse(r =>
      r.url().includes(`/drafts/${draftId}/discard`) && r.status() === 200
    ),
    page.locator(`[data-draft-id="${draftId}"] [data-testid="draft-discard"]`).click(),
  ])
  await page.waitForFunction(prev => (window as any).__draft_op_done__ === prev + 1, before)
}
