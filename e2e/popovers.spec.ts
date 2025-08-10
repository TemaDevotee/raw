import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState, waitForAppReady } from './utils/session'

test.beforeEach(async ({ page }) => {
  await seedAppState(page)
})

test('theme and language popovers work', async ({ page }) => {
  await page.goto('/#/chats?skipAuth=1')
  await waitForAppReady(page)

  const themeTrigger = page.getByTestId('theme-trigger')
  await expect(themeTrigger).toBeVisible()
  await expect(themeTrigger).toBeEnabled()
  await themeTrigger.click()
  await expect(page.getByTestId('theme-item-Classic')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('theme-item-Classic')).toBeHidden()

  const langTrigger = page.getByTestId('lang-trigger')
  await expect(langTrigger).toBeVisible()
  await expect(langTrigger).toBeEnabled()
  await langTrigger.click()
  await expect(page.getByTestId('lang-item-en')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('lang-item-en')).toBeHidden()
})
