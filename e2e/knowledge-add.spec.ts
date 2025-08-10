import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState, waitForAppReady } from './utils/session'

test('add collection via drawer', async ({ page }) => {
  await seedAppState(page, { knowledge: { collections: [] } })
  await page.goto('/#/knowledge?skipAuth=1')
  await waitForAppReady(page)
  const addBtn = page.getByTestId('knowledge-add')
  await expect(addBtn).toBeVisible()
  await expect(addBtn).toBeEnabled()
  await addBtn.click()
  await expect(page.getByTestId('drawer')).toBeVisible()
  await page.getByTestId('collection-name').fill('FAQ')
  const createBtn = page.getByTestId('collection-create')
  await expect(createBtn).toBeVisible()
  await expect(createBtn).toBeEnabled()
  await createBtn.click()
  await expect(page.getByTestId('drawer')).toBeHidden()
  await expect(page.getByTestId('collection-row')).toHaveCount(1)
  await expect(page.getByTestId('collection-row')).toContainText('FAQ')
})
