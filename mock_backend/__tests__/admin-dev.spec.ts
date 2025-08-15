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
  process.env.DEV_IMPERSONATE = '1'
  original = fs.readFileSync(dbPath, 'utf-8')
  server = (await import('../server.js')).default
})

afterAll(() => {
  fs.writeFileSync(dbPath, original)
  server.close()
})

function post(path: string, body: any) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'X-Admin-Key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

describe('admin dev', () => {
  it('seeds demo tenants', async () => {
    const res = await post('/admin/dev/seed/reset', {})
    expect(res.status).toBe(200)
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
    expect(db.tenants.length).toBeGreaterThan(2)
  })

  it('issues impersonation token', async () => {
    const res = await post('/admin/auth/impersonate', { tenantId: 'acme' })
    expect(res.status).toBe(200)
    const js = await res.json()
    const verify = await fetch(`${BASE}/api/dev/impersonate/verify?token=${js.token}`)
    expect(verify.status).toBe(200)
    const data = await verify.json()
    expect(data.tenantId).toBe('acme')
  })
})
