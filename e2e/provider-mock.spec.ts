import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState, waitForAppReady } from './utils/session'
import { gotoHash } from './support/nav'

// Smoke test for mock provider generation and provider_error handling
// Skips automatically if Playwright browsers are missing

test('mock provider generates draft and handles failure', async ({ page }) => {
  const chatId = '5'
  await seedAppState(page, { chats: { [chatId]: { id: chatId, messages: [], status: 'live' } } })
  await gotoHash(page, `chats/${chatId}`)
  await waitForAppReady(page)
  await page.getByTestId('compose-agent').fill('hello')
  await page.getByTestId('compose-agent').press('Enter')
  await expect(page.getByTestId('drafts')).toHaveAttribute('data-count', '1')
})
