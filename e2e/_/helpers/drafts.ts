import { Page } from '@playwright/test'
import { API_BASE } from '../../__setup__'

export async function seedDraft(
  page: Page,
  chatId: string,
  payload: Partial<{ id: string; text: string }> = {},
) {
  const res = await page.request.post(`${API_BASE}/__e2e__/drafts/seed`, {
    data: { chatId, payload },
  })
  const data = await res.json()
  const draft = data.draft || { id: payload.id || 'seed', text: payload.text || '' }
  await page.addInitScript(
    ({ chatId, draft }) => {
      const list = (window as any).__e2eDraftsData || {}
      list[chatId] = list[chatId] || []
      list[chatId].push(draft)
      ;(window as any).__e2eDraftsData = list
    },
    { chatId, draft },
  )
  return draft
}

export async function clickDraftAction(
  page: Page,
  action: 'approve' | 'discard',
  draftId: string,
) {
  const button =
    action === 'approve' ? '[data-test="draft-approve"]' : '[data-test="draft-discard"]'
  await page
    .locator('[data-test="drafts"]')
    .locator(`[data-draft-id="${draftId}"]`)
    .locator(button)
    .click()
}

export async function waitDraftMutation(
  page: Page,
  action: 'approve' | 'discard',
  {
    chatId,
    draftId,
  }: {
    chatId: string
    draftId: string
  },
) {
  const before = await page.evaluate(() => (window as any).__draft_op_done__ || 0)
  const base = `/api/chats/${chatId}/drafts/${draftId}`
  const match = (r: any) => {
    const u = r.url()
    const m = r.request().method()
    if (action === 'approve') {
      return u.includes(`${base}/approve`) && m === 'POST' && r.ok()
    }
    return (
      (u.includes(`${base}/discard`) && m === 'POST' && r.ok()) ||
      (u.endsWith(base) && m === 'DELETE' && r.ok())
    )
  }
  await Promise.all([
    page.waitForResponse(match),
    page.waitForFunction((prev) => (window as any).__draft_op_done__ > prev, before),
  ])
}
