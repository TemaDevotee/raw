import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test.skip('operator interferes and agent reply becomes draft', async ({ page }) => {
  await page.addInitScript(() => {
    const state = JSON.parse(localStorage.getItem('app.state.v2') || '{}');
    state.chats = state.chats || {};
    state.chats['5'] = { id: '5', clientName: 'David Lee', status: 'attention' };
    localStorage.setItem('app.state.v2', JSON.stringify(state));
  });

  let control = 'agent';
  await page.route('**/api/chats/5', (route) => {
    route.fulfill({
      json: {
        id: '5',
        clientName: 'David Lee',
        status: 'attention',
        messages: [],
        controlBy: control,
        heldBy: control === 'operator' ? 'e2e' : null,
      },
    });
  });
  await page.route('**/api/drafts/list/5', (route) => {
    route.fulfill({ json: [] });
  });
  await page.route('**/api/chats/5/interfere', (route) => {
    control = 'operator';
    route.fulfill({ json: { controlBy: 'operator', heldBy: 'e2e', status: 'live' } });
  });
  await page.route('**/api/chats/5/return', (route) => {
    control = 'agent';
    route.fulfill({ json: { controlBy: 'agent', heldBy: null, status: 'attention' } });
  });

  await gotoHash(page, 'chats/5');
  await waitForAppReady(page);
  await page.evaluate(() => {
    // @ts-ignore
    const store = window.__stores.chatStore;
    store.updateChat({
      id: '5',
      clientName: 'David Lee',
      status: 'attention',
      controlBy: 'agent',
      heldBy: null,
      messages: [],
    });
  });

  const input = page.getByTestId('composer');
  await expect(input).toHaveAttribute('data-locked', 'true');

  const interfere = page.getByTestId('btn-interfere');
  await interfere.click();
  await expect(page.getByTestId('btn-return')).toBeVisible();
  await expect(input).toHaveAttribute('data-locked', 'false');

  await page.evaluate(() => {
    // @ts-ignore
    window.__e2e_addDraft({ chatId: '5', text: 'hello from agent' });
  });
  await expect(page.getByTestId('draft-bubble')).toBeVisible();
  await expect(page.getByTestId('drafts-badge')).toHaveText('1');

  const ret = page.getByTestId('btn-return');
  await ret.click();
  await expect(input).toHaveAttribute('data-locked', 'true');
});
