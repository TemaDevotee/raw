import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady } from './support/wait';

test('unknown agent shows not-found screen', async ({ page }) => {
  await seedAppState(page, { agents: [] });
  const errors: string[] = [];
  const warns: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning' && !msg.text().includes('Extraneous non-props attributes')) {
      warns.push(msg.text());
    }
  });
  await gotoHash(page, 'agents/999');
  await waitForAppReady(page);
  await expect(page.getByTestId('agent-not-found')).toBeVisible();
  await page.getByTestId('agents-back').click();
  await expect(page).toHaveURL(/#\/agents$/);
  expect(errors).toHaveLength(0);
  expect(warns).toHaveLength(0);
});
