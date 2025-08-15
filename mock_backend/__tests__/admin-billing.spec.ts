import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

let server: any
const BASE = 'http://localhost:3100'
const KEY = 'dev-admin-key'
const dbPath = path.join(__dirname, '..', 'db.json')
let original: string

beforeAll(async () => {
  process.env.ADMIN_KEY = KEY
  process.env.ADMIN_ORIGIN = 'http://localhost:5199'
  original = fs.readFileSync(dbPath, 'utf-8')
  server = (await import('../server.js')).default
})

afterAll(() => {
  fs.writeFileSync(dbPath, original)
  server.close()
})

function post(path: string, body: any, headers: any = {}) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'X-Admin-Key': KEY, 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  })
}

function get(path: string) {
  return fetch(`${BASE}${path}`, { headers: { 'X-Admin-Key': KEY } })
}

describe('admin billing', () => {
  it('credits tokens and records ledger', async () => {
    const creditRes = await post('/admin/billing/tokens/credit', { tenantId: 't1', amount: 100, reason: 'test' })
    expect(creditRes.status).toBe(201)
    const sumRes = await get('/admin/billing?tenantId=t1')
    const sum = await sumRes.json()
    expect(sum.billing.tokenUsed).toBe(4400)
    const ledgerRes = await get('/admin/billing/ledger?tenantId=t1')
    const ledger = await ledgerRes.json()
    expect(ledger.items[0].type).toBe('credit')
  })

  it('changes plan and updates quotas', async () => {
    const res = await post('/admin/billing/plan/change', { tenantId: 't1', plan: 'PRO' })
    expect(res.status).toBe(201)
    const sumRes = await get('/admin/billing?tenantId=t1')
    const sum = await sumRes.json()
    expect(sum.billing.plan).toBe('PRO')
  })

  it('updates quotas manually', async () => {
    const res = await post('/admin/billing/quota/update', { tenantId: 't1', tokenQuota: 123, storageQuotaMB: 5 })
    expect(res.status).toBe(201)
    const sumRes = await get('/admin/billing?tenantId=t1')
    const sum = await sumRes.json()
    expect(sum.billing.tokenQuota).toBe(123)
    expect(sum.billing.storageQuotaMB).toBe(5)
  })
})
