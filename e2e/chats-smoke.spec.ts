import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState } from './utils/session'

test.beforeEach(async ({ page }) => {
  await seedAppState(page)
})

test('renders chat list with groups and rows', async ({ page }) => {
  await page.goto('/#/chats')
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('chats-view')).toBeVisible()
  const groups = page.getByTestId('chats-groups')
  await expect(groups).toBeVisible()
  await expect(page.locator('[data-testid^="chat-row-"]').first()).toBeVisible()
})

test('collapsing and expanding groups works', async ({ page }) => {
  await page.goto('/#/chats')
  await page.waitForLoadState('networkidle')
  const group = page.getByTestId('group-live')
  const row = page.getByTestId('chat-row-1')
  await expect(row).toBeVisible()
  await group.click()
  await expect(row).not.toBeVisible()
  await group.click()
  await expect(row).toBeVisible()
})
