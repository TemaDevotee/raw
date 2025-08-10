import { Page, expect } from '@playwright/test';

export async function gotoHash(page: Page, path: string, params: Record<string, string | number | boolean> = {}) {
  const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173');
  const qs = new URLSearchParams({ skipAuth: '1', ...Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ) });
  url.hash = `/${path}${qs.toString() ? `?${qs}` : ''}`;
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
}
