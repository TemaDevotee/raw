import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState, waitForAppReady } from './utils/session'

test.beforeEach(async ({ page }) => {
  await seedAppState(page)
})

test('shows human status labels and no assign-to-me filter', async ({ page }) => {
  await page.goto('/#/chats?skipAuth=1')
  await waitForAppReady(page)

  await expect(page.getByTestId('group-live')).toContainText('В эфире')
  await expect(page.getByTestId('group-attention')).toContainText('Требует внимания')
  await expect(page.getByTestId('group-paused')).toContainText('На паузе')
  await expect(page.getByTestId('group-resolved')).toContainText('Решён')
  await expect(page.getByTestId('group-idle')).toContainText('Неактивен')

  await expect(page.getByTestId('filter-mine')).toHaveCount(0)
})
