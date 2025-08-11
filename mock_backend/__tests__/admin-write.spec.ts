import { beforeAll, afterAll, describe, expect, it } from 'vitest';

let server: any;
const BASE = 'http://localhost:3100';
const KEY = 'dev-admin';
const dbPath = require('path').join(__dirname, '..', 'db.json');
const fs = require('fs');
let original: string;

beforeAll(async () => {
  process.env.ADMIN_KEY = KEY;
  process.env.ADMIN_ORIGIN = 'http://localhost:5175';
  original = fs.readFileSync(dbPath, 'utf-8');
  server = (await import('../server.js')).default;
});

afterAll(() => {
  fs.writeFileSync(dbPath, original);
  server.close();
});

function post(path: string, body: any) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'X-Admin-Key': KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

function get(path: string) {
  return fetch(`${BASE}${path}`, { headers: { 'X-Admin-Key': KEY } });
}

describe('admin billing write ops', () => {
  it('allows plan change and logs ledger', async () => {
    const res = await post('/admin/tenants/t1/billing/plan', { plan: 'Pro' });
    const json = await res.json();
    expect(json.billing.plan).toBe('Pro');
    const ledger = await get('/admin/tenants/t1/billing/ledger');
    const log = await ledger.json();
    expect(log.items[0].type).toBe('plan-change');
  });

  it('credits and debits tokens and recomputes usage', async () => {
    const before = await get('/admin/tenants/t1');
    const bjson = await before.json();
    await post('/admin/tenants/t1/billing/debit', { amount: 1000 });
    const afterDebit = await get('/admin/tenants/t1');
    const ad = await afterDebit.json();
    expect(ad.billing.tokenUsed).toBe(bjson.billing.tokenUsed + 1000);
    await post('/admin/tenants/t1/billing/credit', { amount: 500 });
    const afterCredit = await get('/admin/tenants/t1');
    const ac = await afterCredit.json();
    expect(ac.billing.tokenUsed).toBe(ad.billing.tokenUsed - 500);
  });

  it('resets period to zero usage', async () => {
    const res = await post('/admin/tenants/t1/billing/reset-period', {});
    const json = await res.json();
    expect(json.billing.tokenUsed).toBe(0);
  });
});
