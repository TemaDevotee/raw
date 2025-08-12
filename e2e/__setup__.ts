import { test as base } from '@playwright/test';
import { wire404Debug } from './support/log';

export const APP_BASE =
  process.env.PLAYWRIGHT_APP_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
export const API_BASE =
  process.env.PLAYWRIGHT_BACKEND_URL ?? process.env.MOCK_BASE_URL ?? 'http://localhost:3100';

base.beforeEach(async ({ page }) => {
  wire404Debug(page)
  page.on('pageerror', (e) => console.log('[PAGEERROR]', e.message))
  await page.addInitScript(
    ({ apiBase }) => {
      ;(window as any).__E2E__ = true
      ;(window as any).__E2E_API_BASE__ = apiBase
    },
    { apiBase: API_BASE },
  )
})
