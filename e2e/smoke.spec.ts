import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('login page renders and app loads', async ({ page }) => {
  await page.goto('/login.html');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('form')).toBeVisible();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('sidebar')).toBeVisible();
});
