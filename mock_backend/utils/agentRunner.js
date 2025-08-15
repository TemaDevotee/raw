const fs = require('fs')
const path = require('path')
const { nanoid } = require('nanoid')
const { emit } = require('./eventBus')

const dbPath = path.join(__dirname, '../db.json')
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
const writeDb = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))

// simple per-chat queue using a Map of pending flags
const running = new Map()

function findChat(db, chatId) {
  for (const t of db.tenants || []) {
    const c = (t.chats || []).find(ch => ch.id === chatId)
    if (c) return { tenant: t, chat: c }
  }
  return null
}

function scheduleDraft(chatId, text) {
  if (running.get(chatId)) return false
  const db = readDb()
  const found = findChat(db, chatId)
  if (!found) return false
  if (found.chat.agentState === 'paused') return false
  running.set(chatId, true)
  found.chat.agentState = 'typing'
  writeDb(db)
  emit(found.tenant.id, { type: 'agent:state', chatId, state: 'typing' })
  emit(found.tenant.id, { type: 'agent:typing', chatId, step: 'start' })
  setTimeout(() => {
    const db2 = readDb()
    const found2 = findChat(db2, chatId)
    if (!found2) { running.delete(chatId); return }
    if (found2.chat.agentState === 'paused') { running.delete(chatId); return }
    const draft = { id: nanoid(), text: `Mock reply: ${text}`, createdAt: new Date().toISOString() }
    found2.chat.drafts = found2.chat.drafts || []
    found2.chat.drafts.push(draft)
    found2.chat.updatedAt = draft.createdAt
    found2.chat.agentState = 'idle'
    writeDb(db2)
    emit(found2.tenant.id, { type: 'draft:created', chatId, draft })
    emit(found2.tenant.id, { type: 'agent:typing', chatId, step: 'stop' })
    emit(found2.tenant.id, { type: 'agent:state', chatId, state: 'idle' })
    running.delete(chatId)
  }, 1000)
  return true
}

function pauseChat(chatId) {
  const db = readDb()
  const found = findChat(db, chatId)
  if (!found) return false
  found.chat.agentState = 'paused'
  writeDb(db)
  emit(found.tenant.id, { type: 'agent:state', chatId, state: 'paused' })
  return true
}

function resumeChat(chatId) {
  const db = readDb()
  const found = findChat(db, chatId)
  if (!found) return false
  found.chat.agentState = 'idle'
  writeDb(db)
  emit(found.tenant.id, { type: 'agent:state', chatId, state: 'idle' })
  return true
}

function generate(chatId) {
  const db = readDb()
  const found = findChat(db, chatId)
  if (!found) return false
  const lastUser = [...(found.chat.messages || [])].reverse().find(m => m.role === 'user' || m.role === 'client')
  if (!lastUser) return false
  return scheduleDraft(chatId, lastUser.text)
}

module.exports = { scheduleDraft, pauseChat, resumeChat, generate }
