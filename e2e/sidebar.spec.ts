import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page, { workspaces: [{ id: 'w1', name: 'A' }, { id: 'w2', name: 'B' }] });
});

test('workspace switcher renders', async ({ page }) => {
  await gotoHash(page, 'chats');
  await waitForAppReady(page);
  await page.getByTestId('workspace-switcher').waitFor();
  await expect(page.getByTestId('workspace-switcher')).toBeVisible();
});
