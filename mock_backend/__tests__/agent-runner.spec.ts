import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { scheduleDraft } from '../utils/agentRunner'

const dbPath = path.join(__dirname, '../db.json')

function readDb() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
}

describe('agent runner', () => {
  it('creates a draft for user messages', async () => {
    const db = readDb()
    const chatId = db.tenants[0].chats[0].id
    scheduleDraft(chatId, 'hello')
    await new Promise(r => setTimeout(r, 1100))
    const db2 = readDb()
    const d = db2.tenants[0].chats[0].drafts.find((x: any) => x.text.startsWith('Mock reply'))
    expect(d).toBeTruthy()
  })
})
