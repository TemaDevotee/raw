import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test.skip('draft approval publishes message', async ({ page }) => {
  await page.route('**/api/drafts/list/5', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/drafts/approve/**', (route) =>
    route.fulfill({
      json: {
        chatId: '5',
        message: { sender: 'agent', text: 'hello from agent', time: 'now', visibility: 'public' },
      },
    }),
  );
  await gotoHash(page, 'chats/5');
  await waitForAppReady(page);
  await page.evaluate(() => {
    // @ts-ignore
    const store = window.__stores.chatStore;
    store.updateChat({ id: '5', clientName: 'Demo', status: 'attention', controlBy: 'agent', heldBy: null, messages: [] });
  });
  await page.getByTestId('btn-interfere').click();
  await page.evaluate(() => {
    // @ts-ignore
    window.__e2e_addDraft({ chatId: '5', text: 'hello from agent' });
  });
  await expect(page.getByTestId('draft-bubble')).toBeVisible();
  await page.getByTestId('draft-approve').click();
  await page.waitForFunction(() => window.__stores.draftStore.count('5') === 0);
  await expect(page.getByText('hello from agent')).toBeVisible();
});
