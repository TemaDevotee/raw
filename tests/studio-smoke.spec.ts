import { test, expect } from '@playwright/test';

const base = `http://localhost:${process.env.STUDIO_PORT || '5199'}`;

async function login(page, email: string) {
  await page.goto(`${base}/#/login`);
  await page.fill('input[placeholder="Email / Электронная почта"]', email);
  await page.fill('input[placeholder="Password / Пароль"]', 'RawDev!2025');
  await page.click('button:has-text("Login")');
  await page.waitForSelector('text=Preflight');
  await page.waitForSelector('button:has-text("Continue to Studio"):not([disabled])');
  await page.click('button:has-text("Continue to Studio")');
}

test('owner flows', async ({ page }) => {
  await login(page, 'alpha@raw.dev');
  await expect(page.locator('header')).toContainText('alpha@raw.dev');
  await page.click('text=Users');
  await expect(page.locator('tbody tr')).toHaveCount(3);
  await page.click('text=Chats');
  expect(await page.locator('tbody tr').count()).toBeGreaterThan(4);
  await page.click('tbody tr:first-child');
  await expect(page.locator('div').filter({ hasText: 'Draft' }).first()).toBeVisible();
});

test('operator can view chats and knowledge', async ({ page }) => {
  await login(page, 'alpha.op@raw.dev');
  await page.click('text=Chats');
  expect(await page.locator('tbody tr').count()).toBeGreaterThan(4);
  await page.click('text=Knowledge');
  await expect(page.locator('tbody tr')).toHaveCountGreaterThan(0);
});

test('viewer read-only', async ({ page }) => {
  await login(page, 'alpha.view@raw.dev');
  await page.click('text=Chats');
  expect(await page.locator('tbody tr').count()).toBeGreaterThan(4);
  await page.click('text=Users');
  await expect(page.locator('tbody tr')).toHaveCountGreaterThan(0);
});

test('switch tenant', async ({ page }) => {
  await login(page, 'alpha@raw.dev');
  await page.selectOption('select', { label: /Beta/ });
  await expect(page.locator('header')).toContainText('alpha@raw.dev');
  await page.click('text=Chats');
  expect(await page.locator('tbody tr').count()).toBeGreaterThan(4);
});
