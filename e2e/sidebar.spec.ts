import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

const twoWorkspaces = [
  { id: 'ws1', name: 'Default' },
  { id: 'ws2', name: 'Secondary' },
];

test('workspace switcher toggles with workspace count', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('sidebar')).toBeVisible();
  await expect(page.getByTestId('workspace-switcher')).toHaveCount(0);
  await page.unroute('**/api/workspaces*');
  await page.route('**/api/workspaces*', (route) => {
    route.fulfill({ json: twoWorkspaces });
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('workspace-switcher')).toBeVisible();
});
