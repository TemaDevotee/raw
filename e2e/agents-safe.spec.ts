import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady } from './support/wait';

test('unknown agent redirects with toast', async ({ page }) => {
  await seedAppState(page, { agents: [] });
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await gotoHash(page, 'agents/unknown');
  await waitForAppReady(page);
  await expect(page).toHaveURL(/#\/agents$/);
  await expect(page.getByText('Agent not found')).toBeVisible();
  expect(errors).toHaveLength(0);
});

test.skip('existing agent renders detail', async ({ page }) => {
  await seedAppState(page, { agents: [{ id: 'a1', name: 'Support Bot' }] });
  await gotoHash(page, 'agents/a1');
  await waitForAppReady(page);
  await expect(page.getByTestId('agent-name')).toHaveText(/Support Bot/i);
});
