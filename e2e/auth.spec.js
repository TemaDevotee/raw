import { test, expect } from '@playwright/test';
import { mockRoutes } from './mocks/routes.js';

test('redirects unauthenticated users to login', async ({ page }) => {
  await mockRoutes(page);
  await page.goto('/');
  await expect(page).toHaveURL(/login\.html/);
});
