import { test, expect } from '@playwright/test'
import './__setup__'
import { seedAppState, waitForAppReady } from './utils/session'

test('unknown agent shows empty state', async ({ page }) => {
  await seedAppState(page, { agents: [] })
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  await page.goto('/#/agents/999?skipAuth=1')
  await waitForAppReady(page)
  await expect(page.getByTestId('agent-not-found')).toBeVisible()
  expect(errors).toHaveLength(0)
})

test('existing agent renders detail', async ({ page }) => {
  await seedAppState(page, { agents: [{ id: 'a1', name: 'Support Bot' }] })
  await page.goto('/#/agents/a1?skipAuth=1')
  await waitForAppReady(page)
  await expect(page.getByTestId('agent-name')).toHaveText(/Support Bot/i)
})
