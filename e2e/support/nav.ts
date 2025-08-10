import { Page, expect } from '@playwright/test';
import { APP_BASE } from '../__setup__';

export async function gotoHash(page: Page, path: string, params: Record<string, string | number | boolean> = {}) {
  const url = new URL(APP_BASE);
  const qs = new URLSearchParams({ skipAuth: '1', ...Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ) });
  url.hash = `/${path}${qs.toString() ? `?${qs}` : ''}`;
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
}
