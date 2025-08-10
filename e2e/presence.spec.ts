import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState, waitForAppReady } from './utils/session'

test.beforeEach(async ({ page }) => {
  await seedAppState(page)
})

test.skip('presence stacks update after participant leaves', async ({ page }) => {
  await page.goto('/#/chats?skipAuth=1')
  await waitForAppReady(page)
  await page.getByTestId('presence-stack-row-1').waitFor()
  await expect(page.getByTestId('presence-stack-row-1').locator('.avatar')).toHaveCount(4)
  await page.getByTestId('chat-row-1').click()
  await page.getByTestId('presence-stack-header').waitFor()
  const header = page.getByTestId('presence-stack-header')
  await expect(header.locator('.avatar')).toHaveCount(4)
  await expect(header.locator('.overflow')).toHaveCount(1)

  await page.evaluate(() => {
    window.__e2ePresenceData['1'].pop()
  })

  await page.reload()
  await waitForAppReady(page)
  await page.getByTestId('presence-stack-header').waitFor()
  await expect(page.getByTestId('presence-stack-header').locator('.avatar')).toHaveCount(3)
  await expect(page.getByTestId('presence-stack-header').locator('.overflow')).toHaveCount(0)
})
