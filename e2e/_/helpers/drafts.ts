import { Page } from '@playwright/test'
import { API_BASE } from '../../__setup__'

export async function seedDraft(
  page: Page,
  chatId: string,
  payload: Partial<{ id: string; text: string }> = {},
) {
  await page.request.post(`${API_BASE}/__e2e__/drafts/seed`, {
    data: { chatId, payload },
  })
  await page.addInitScript(
    ({ chatId, payload }) => {
      const list = (window as any).__e2eDraftsData || {};
      list[chatId] = list[chatId] || [];
      list[chatId].push({ id: payload.id || 'seed', text: payload.text || '' });
      (window as any).__e2eDraftsData = list;
    },
    { chatId, payload },
  );
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

