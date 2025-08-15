import { describe, it, expect } from 'vitest'
const { saveSettings } = require('../utils/agentSettings')
const { generate } = require('../utils/agentRunner')
const { readDb } = require('../utils/db')

describe('agent settings integration', () => {
  it('saves settings and generates draft', async () => {
    const db = readDb()
    const chatId = db.tenants[0].chats[0].id
    saveSettings(chatId, { systemPrompt: 'Test prompt', temperature: 0.1 })
    generate(chatId)
    await new Promise(r => setTimeout(r, 1200))
    const db2 = readDb()
    const d = db2.tenants[0].chats[0].drafts.find((x) => x.text.startsWith('Echo'))
    expect(d).toBeTruthy()
  })
})
