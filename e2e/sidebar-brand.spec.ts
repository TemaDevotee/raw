import { test, expect } from '@playwright/test'
import { gotoHash } from './support/nav'
import { waitForAppReady } from './support/wait'

const SIDEBAR_KEY = 'app.ui.sidebar.collapsed'
const AUTH_KEY = 'authenticated'
const SKIP_KEY = 'skipAuth'

test('brand mark appears only when sidebar collapsed', async ({ page }) => {
  await page.addInitScript((collapse, auth, skip) => {
    localStorage.setItem(collapse, '1')
    localStorage.setItem('__e2e__', '1')
    localStorage.setItem('appTheme', 'classic')
    localStorage.setItem(auth, 'true')
    localStorage.setItem(skip, 'true')
  }, SIDEBAR_KEY, AUTH_KEY, SKIP_KEY)
  await gotoHash(page, 'chats')
  await waitForAppReady(page)

  await expect(page.getByTestId('brand-mark')).toBeVisible()

  await page.getByTestId('sidebar-toggle').click()
  await expect(page.getByTestId('brand-mark')).toBeHidden()

  await page.getByTestId('sidebar-toggle').click()
  await expect(page.getByTestId('brand-mark')).toBeVisible()
})
