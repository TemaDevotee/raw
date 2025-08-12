import { expect, Page } from '@playwright/test'
import { API_BASE } from '../../__setup__'

export async function seedPresence(
  page: Page,
  payload: { chatId: string; participants: Array<{ id: string; name?: string }> }
) {
  const res = await page.request.post(`${API_BASE}/__e2e__/presence`, { data: payload })
  expect(res.ok()).toBeTruthy()
  await page.evaluate(({ chatId, participants }) => {
    // @ts-ignore
    window.__stores?.presenceStore?.__e2e__setPresence(chatId, participants)
  }, payload)
}

export async function awaitPresenceReady(page: Page, opts: { expected: number }) {
  const stack = page.locator('[data-test="presence-stack"]')
  await expect(stack).toBeVisible()
  const avatars = stack.locator('[data-test="presence-avatar"]')
  await expect(avatars).toHaveCount(opts.expected)
}
