import { describe, it, expect } from 'vitest'
const { generate } = require('../utils/agentRunner')
const { readDb, writeDb } = require('../utils/db')
const { subscribe } = require('../utils/eventBus')

describe('agent quota', () => {
  it('emits quota_exceeded when no tokens left', () => {
    const db = readDb()
    const tenant = db.tenants[0]
    tenant.billing.tokenQuota = 0
    tenant.billing.tokenUsed = 0
    writeDb(db)
    const chatId = tenant.chats[0].id
    let err
    subscribe(tenant.id, ev => { if (ev.type === 'agent:error') err = ev })
    generate(chatId)
    expect(err && err.code).toBe('quota_exceeded')
  })
})
