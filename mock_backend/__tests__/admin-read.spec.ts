import { beforeAll, afterAll, describe, expect, it } from 'vitest';

let server: any;
const BASE = 'http://localhost:3100';

beforeAll(async () => {
  process.env.ADMIN_KEY = 'dev-admin';
  process.env.ADMIN_ORIGIN = 'http://localhost:5175';
  server = (await import('../server.js')).default;
});

afterAll(() => {
  server.close();
});

function fetchAdmin(path: string, key?: string) {
  return fetch(`${BASE}${path}`, {
    headers: key ? { 'X-Admin-Key': key } : undefined,
  });
}

describe('admin read-only endpoints', () => {
  it('rejects missing X-Admin-Key', async () => {
    const res = await fetchAdmin('/admin/tenants');
    expect(res.status).toBe(401);
  });

  it('rejects invalid X-Admin-Key', async () => {
    const res = await fetchAdmin('/admin/tenants', 'bad-key');
    expect(res.status).toBe(401);
  });

  it('supports filtering and pagination on tenants list', async () => {
    const res = await fetchAdmin('/admin/tenants?plan=Pro', 'dev-admin');
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.items).toHaveLength(1);
    expect(json.items[0].billing.plan).toBe('Pro');

    const pageRes = await fetchAdmin('/admin/tenants?page=2&limit=1', 'dev-admin');
    const pageJson = await pageRes.json();
    expect(pageJson.page).toBe(2);
    expect(pageJson.items).toHaveLength(1);
  });

  it('returns 404 for unknown tenant id', async () => {
    const res = await fetchAdmin('/admin/tenants/nope', 'dev-admin');
    expect(res.status).toBe(404);
  });
});
