import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState } from './utils/session'

test.beforeEach(async ({ page }) => {
  await seedAppState(page)
})

test('presence stacks update after participant leaves', async ({ page }) => {
  const payload = [
    {
      chatId: '1',
      participants: [
        { id: 'u1', name: 'Alice', role: 'operator', online: true },
        { id: 'u2', name: 'Bob', role: 'operator', online: true },
        { id: 'u3', name: 'Charlie', role: 'observer', online: true },
        { id: 'u4', name: 'Dana', role: 'observer', online: true },
      ],
      updatedAt: 'now',
    },
  ]
  await page.route('**/presence/list', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })
  await page.goto('/#/chats/1')
  await page.waitForLoadState('networkidle')
  const header = page.getByTestId('presence-stack-header')
  await expect(header.locator('.avatar')).toHaveCount(4)
  await expect(header).toContainText('+1')
  const row = page.getByTestId('presence-stack-row-1')
  await expect(row.locator('.avatar')).toHaveCount(4)
  payload[0].participants.pop()
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('presence-stack-header').locator('.avatar')).toHaveCount(3)
  await expect(page.getByTestId('presence-stack-header')).not.toContainText('+')
  await expect(page.getByTestId('presence-stack-row-1').locator('.avatar')).toHaveCount(3)
})
