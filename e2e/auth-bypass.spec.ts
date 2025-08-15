import { test, expect } from '@playwright/test'
import './__setup__'

// Ensure login.html redirects to SPA and sets auth via skipAuth

test('login.html?skipAuth=1 redirects into app without login form', async ({ page }) => {
  await page.goto('/login.html?skipAuth=1')
  await page.waitForURL('**/#/?skipAuth=1**')
  await page.waitForSelector('[data-test-ready="1"]')
  await expect(page.locator('#login-form')).toHaveCount(0)
  const authed = await page.evaluate(() => localStorage.getItem('authenticated'))
  expect(authed).toBe('true')
})
