import { beforeAll, afterAll, describe, it, expect } from 'vitest';

let server: any;
const BASE = 'http://localhost:3100';

beforeAll(async () => {
  server = (await import('../server.js')).default;
});

afterAll(() => {
  server.close();
});

describe('GET /api/tenants', () => {
  it('returns tenants with id and name', async () => {
    const res = await fetch(`${BASE}/api/tenants`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    for (const t of data) {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('name');
    }
  });
});
