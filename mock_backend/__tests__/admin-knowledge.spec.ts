import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

let server: any
const BASE = 'http://localhost:3100'
const KEY = 'dev-admin'
const dbPath = path.join(__dirname, '..', 'db.json')
let original: string

beforeAll(async () => {
  process.env.ADMIN_KEY = KEY
  process.env.ADMIN_ORIGIN = 'http://localhost:5175'
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

function get(path: string) {
  return fetch(`${BASE}${path}`, { headers: { 'X-Admin-Key': KEY } })
}

describe('admin knowledge', () => {
  it('creates collection and uploads file', async () => {
    const collRes = await post('/admin/knowledge/collections', { tenantId: 't1', name: 'Docs' })
    const coll = await collRes.json()
    const fd = new FormData()
    fd.append('file', new Blob(['hello'], { type: 'text/plain' }), 'a.txt')
    const upRes = await fetch(`${BASE}/admin/knowledge/collections/${coll.id}/files`, {
      method: 'POST',
      headers: { 'X-Admin-Key': KEY },
      body: fd
    })
    expect(upRes.status).toBe(201)
    const info = await get(`/admin/knowledge?tenantId=t1`)
    const json = await info.json()
    expect(json.collections[0].filesCount).toBe(1)
  })
})
