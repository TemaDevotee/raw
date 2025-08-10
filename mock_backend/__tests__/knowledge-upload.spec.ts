import { beforeAll, afterAll, describe, expect, it } from 'vitest'

let server: any
const BASE = 'http://localhost:3001'

beforeAll(async () => {
  server = (await import('../server.js')).default
})

afterAll(() => {
  server.close()
})

describe('knowledge upload', () => {
  it('uploads a text file', async () => {
    const collRes = await fetch(BASE + '/api/knowledge/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: 't1', name: 'Docs' })
    })
    const coll = await collRes.json()
    const fd = new FormData()
    fd.append('tenantId', 't1')
    fd.append('collectionId', coll.id)
    const blob = new Blob(['hello world'], { type: 'text/plain' })
    fd.append('file', blob, 'hello.txt')
    const res = await fetch(BASE + '/api/knowledge/upload', { method: 'POST', body: fd })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.name).toBe('hello.txt')
  })
})
