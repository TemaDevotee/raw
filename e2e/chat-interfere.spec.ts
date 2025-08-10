import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('interfere toggles control and status updates', async ({ page }) => {
  await page.addInitScript(() => {
    const state = JSON.parse(localStorage.getItem('app.state.v2') || '{}');
    state.chats = state.chats || {};
    state.chats['5'] = { id: 5, clientName: 'David Lee', status: 'attention' };
    localStorage.setItem('app.state.v2', JSON.stringify(state));
  });
  await page.route('**/api/chats/5', (route) => {
    route.fulfill({ json: { id: 5, clientName: 'David Lee', status: 'attention', messages: [], controlBy: 'agent' } });
  });
  await page.route('**/api/chats/5/interfere', (route) => {
    route.fulfill({ json: { controlBy: 'operator', heldBy: '1', status: 'live' } });
  });
  await page.route('**/api/chats/5/return', (route) => {
    route.fulfill({ json: { controlBy: 'agent', heldBy: null, status: 'attention' } });
  });
  await page.route('**/api/chats/5/status', (route) => {
    route.fulfill({ json: { status: 'resolved' } });
  });
  await gotoHash(page, 'chats/5');
  await waitForAppReady(page);
  await expect(page.getByRole('heading', { level: 2, name: 'David Lee' })).toBeVisible();

  await expect(page.getByTestId('chat-header-gradient')).toBeVisible();

  const input = page.getByTestId('composer-input');
  await expect(input).toBeDisabled();

  const interfere = page.getByTestId('btn-interfere');
  await expect(interfere).toBeVisible();
  await expect(interfere).toBeEnabled();
  await interfere.click();
  await expect(input).toBeEnabled();
  await page.evaluate(() => {
    const store = window.__stores.chatStore;
    store.state.drafts['5'] = [{ id: 'd1', body: 'Agent draft' }];
  });
  await expect(page.getByText('Agent draft')).toBeVisible();
  const ret = page.getByTestId('btn-return');
  await expect(ret).toBeVisible();
  await expect(ret).toBeEnabled();
  await ret.click();
  await expect(input).toBeDisabled();

  const change = page.getByTestId('btn-change-status');
  await expect(change).toBeVisible();
  await expect(change).toBeEnabled();
  await change.click();
  const item = page.getByTestId('status-item-resolved');
  await expect(item).toBeVisible();
  await item.click();
  await expect(page.getByText('Resolved')).toBeVisible();
});
