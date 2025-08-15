import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

let server: any
const BASE = 'http://localhost:3100'
const KEY = 'dev-admin-key'
const dbPath = path.join(__dirname, '..', 'db.json')
let original: string

async function login(email: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'demo123!' })
  })
  const json = await res.json()
  return json.token
}

beforeAll(async () => {
  process.env.ADMIN_KEY = KEY
  process.env.ADMIN_ORIGIN = 'http://localhost:5199'
  process.env.DEV_LOGIN = '1'
  original = fs.readFileSync(dbPath, 'utf-8')
  server = (await import('../server.js')).default
})

afterAll(() => {
  fs.writeFileSync(dbPath, original)
  server.close()
})

describe('admin rbac', () => {
  it('blocks viewer from crediting tokens', async () => {
    const token = await login('view@acme.demo')
    const res = await fetch(`${BASE}/admin/billing/tokens/credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': KEY,
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ tenantId: 'acme', amount: 10 })
    })
    expect(res.status).toBe(403)
  })

  it('allows owner to credit tokens', async () => {
    const token = await login('owner@acme.demo')
    const res = await fetch(`${BASE}/admin/billing/tokens/credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': KEY,
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ tenantId: 'acme', amount: 10 })
    })
    expect(res.status).toBe(201)
  })
})
