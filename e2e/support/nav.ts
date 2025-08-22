import { Page } from '@playwright/test';
import { APP_BASE } from '../__setup__';

export async function gotoHash(
  page: Page,
  path: string,
  params: Record<string, string | number | boolean> = {},
) {
  await page.addInitScript(() => {
    sessionStorage.setItem('auth:token', 'dev-e2e');
    sessionStorage.setItem(
      'auth:user',
      JSON.stringify({ id: 'alpha', email: 'alpha@raw.dev', name: 'Alpha', tenant: 'alpha' }),
    );
    sessionStorage.setItem(
      'auth:tenants',
      JSON.stringify([{ id: 'alpha', name: 'Alpha', role: 'owner' }]),
    );
    sessionStorage.setItem('auth:currentTenantId', 'alpha');
  });
  const url = new URL(APP_BASE);
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  );
  url.hash = `/${path}${qs.toString() ? `?${qs}` : ''}`;
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
}
