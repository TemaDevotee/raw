import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState } from './utils/session'
import { gotoChats, seedPresence, awaitPresenceReady } from './_/helpers'

test.beforeEach(async ({ page }) => {
  await seedAppState(page)
})

test('renders seeded participants deterministically', async ({ page }) => {
  await gotoChats(page)

  const chatId = '1'
  await seedPresence(page, {
    chatId,
    participants: [
      { id: 'u1', name: 'Alice' },
      { id: 'u2', name: 'Bob' },
      { id: 'u3', name: 'Charlie' },
      { id: 'u4', name: 'Dana' },
      { id: 'u5', name: 'Eve' },
    ],
  })

  await awaitPresenceReady(page, { expected: 3 })

  const stack = page.locator('[data-test="presence-stack"]')
  await expect(stack.locator('[data-test="presence-avatar"]')).toHaveCount(3)
  await expect(stack.locator('[data-test="presence-overflow"]')).toBeVisible()
})
