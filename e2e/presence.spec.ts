import { test, expect } from '@playwright/test';
import './__setup__';
import { seedAppState, seedPresence } from './utils/session';
import { gotoHash } from './support/nav';
import { waitForAppReady } from './support/wait';

test.beforeEach(async ({ page }) => {
  await seedAppState(page);
});

test('presence stacks update after participant leaves', async ({ page }) => {
  await seedPresence(page, [
    {
      chatId: '1',
      participants: [
        { id: 'u1', name: 'Alice', role: 'operator', online: true },
        { id: 'u2', name: 'Bob', role: 'operator', online: true },
        { id: 'u3', name: 'Charlie', role: 'observer', online: true },
        { id: 'u4', name: 'Dana', role: 'observer', online: false },
      ],
    },
  ]);
  await gotoHash(page, 'chats');
  await waitForAppReady(page);
  await page.getByTestId('presence-stack-row-1').waitFor();
  await expect(page.getByTestId('presence-stack-row-1').locator('.avatar')).toHaveCount(4);
  await page.getByTestId('chat-row-1').click();
  await page.getByTestId('presence-stack').waitFor();
  const header = page.getByTestId('presence-stack');
  await expect(header.locator('.avatar')).toHaveCount(4);
  await expect(header.getByTestId('presence-overflow')).toHaveCount(1);

  await seedPresence(page, [
    {
      chatId: '1',
      participants: [
        { id: 'u1', name: 'Alice', role: 'operator', online: true },
        { id: 'u2', name: 'Bob', role: 'operator', online: true },
        { id: 'u3', name: 'Charlie', role: 'observer', online: true },
      ],
    },
  ]);
  await page.reload();
  await waitForAppReady(page);
  await page.getByTestId('presence-stack').waitFor();
  await expect(page.getByTestId('presence-stack').locator('.avatar')).toHaveCount(3);
  await expect(page.getByTestId('presence-stack').getByTestId('presence-overflow')).toHaveCount(0);
});
