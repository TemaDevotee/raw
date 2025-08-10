export { waitForAppReady } from '../utils/session';
import { expect } from '@playwright/test';

export async function waitForDraftCount(page, n) {
  await expect(page.getByTestId('draft-bubble')).toHaveCount(n);
}

export async function waitForBadgeCount(page, n) {
  const badge = page.getByTestId('drafts-badge');
  if (n === 0) {
    await expect(badge).toHaveCount(0);
  } else {
    await expect(badge).toHaveText(String(n));
  }
}
