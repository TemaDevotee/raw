import { test, expect } from '@playwright/test';
import './__setup__';

test('login page renders and app loads', async ({ page }) => {
  await page.goto('/login.html');
  await expect(page.locator('form')).toBeVisible();
  await page.goto('/');
  await expect(page.getByTestId('sidebar')).toBeVisible();
});
