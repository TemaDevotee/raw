import { test } from '@playwright/test'
import './__setup__'
import { gotoChats, expectBrandColor } from './_/helpers'
import { seedAppState } from './utils/session'

const SIDEBAR_KEY = 'app.ui.sidebar.collapsed'
const AUTH_KEY = 'authenticated'

test('brand mark inherits sidebar currentColor', async ({ page }) => {
  await page.addInitScript((collapse, auth) => {
    localStorage.setItem(collapse, '1')
    localStorage.setItem('__e2e__', '1')
    localStorage.setItem('appTheme', 'classic')
    localStorage.setItem(auth, 'true')
  }, SIDEBAR_KEY, AUTH_KEY)
  await seedAppState(page)
  await gotoChats(page)
  await expectBrandColor(page)
})
