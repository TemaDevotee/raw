import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady } from './support/wait';

test('add collection via drawer', async ({ page }) => {
  await seedAppState(page, { knowledge: { collections: [] } });
  const errors: string[] = [];
  const warns: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning' && !msg.text().includes('Extraneous non-props attributes')) {
      warns.push(msg.text());
    }
  });
  await gotoHash(page, 'knowledge');
  await waitForAppReady(page);
  const add = page.getByTestId('knowledge-add-trigger');
  await expect(add).toBeVisible();
  await expect(add).toBeEnabled();
  await add.click();
  await expect(page.getByTestId('knowledge-add-drawer')).toBeVisible();
  await page.getByTestId('collection-name-input').fill('Test Collection');
  const createBtn = page.getByTestId('collection-create-submit');
  await expect(createBtn).toBeVisible();
  await expect(createBtn).toBeEnabled();
  await createBtn.click();
  await expect(page.getByTestId('knowledge-add-drawer')).toBeHidden();
  const list = page.getByTestId('knowledge-collections');
  await expect(list.getByTestId('knowledge-collection-item')).toContainText('Test Collection');
  expect(errors).toHaveLength(0);
  expect(warns).toHaveLength(0);
});
