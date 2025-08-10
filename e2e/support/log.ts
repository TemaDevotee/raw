import type { Page } from '@playwright/test';

export function wire404Debug(page: Page) {
  page.on('response', (res) => {
    const s = res.status();
    if (s >= 400) console.log('HTTP', s, res.url());
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('Console:', msg.text());
  });
}
