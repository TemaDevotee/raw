import { Page } from '@playwright/test'

const BASE = process.env.MOCK_BASE_URL ?? 'http://localhost:3100'

export async function seedDraft(
  page: Page,
  chatId: string,
  payload: Partial<{ id: string; text: string }> = {},
) {
  await page.request.post(`${BASE}/__e2e__/drafts/seed`, {
    data: { chatId, payload },
  })
}

export async function waitForDraftOp(
  page: Page,
  chatId: string,
  draftId: string,
  op: 'approve' | 'discard',
) {
  await page.evaluate(
    ({ chatId, draftId, op }) =>
      new Promise<void>((resolve) => {
        const handler = (e: any) => {
          const d = e.detail || {}
          if (d.chatId === chatId && d.draftId === draftId && d.op === op) {
            window.removeEventListener('__draft_op_done__', handler)
            resolve()
          }
        }
        window.addEventListener('__draft_op_done__', handler)
      }),
    { chatId, draftId, op },
  )
}

