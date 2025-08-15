const express = require('express')
const fs = require('fs')
const path = require('path')
const { nanoid } = require('nanoid')

const dbPath = path.join(__dirname, '../db.json')
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
const writeDb = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))

function findChat(db, chatId) {
  for (const t of db.tenants || []) {
    const c = (t.chats || []).find(ch => ch.id === chatId)
    if (c) return { tenant: t, chat: c }
  }
  return null
}

const { requireRole } = require('../utils/adminAuth')
const { emit } = require('../utils/eventBus')
const { scheduleDraft } = require('../utils/agentRunner')
const { getSettings, saveSettings } = require('../utils/agentSettings')
const router = express.Router()

router.use(requireRole(['owner','operator','viewer']))

router.get('/', (req, res) => {
  const { tenantId } = req.query
  const db = readDb()
  const t = (db.tenants || []).find(tt => tt.id === tenantId)
  if (!t) return res.status(404).json({ error: 'not_found' })
  res.json({ items: t.chats || [] })
})

router.get('/:id/transcript', (req, res) => {
  const { since } = req.query
  const db = readDb()
  const found = findChat(db, req.params.id)
  if (!found) return res.status(404).json({ error: 'not_found' })
  let msgs = found.chat.messages || []
  if (since) {
    const s = Number(since)
    msgs = msgs.filter(m => m.ts > s)
  }
  res.json(msgs)
})

router.get('/:id/drafts', (req, res) => {
  const { since } = req.query
  const db = readDb()
  const found = findChat(db, req.params.id)
  if (!found) return res.status(404).json({ error: 'not_found' })
  let ds = found.chat.drafts || []
  if (since) {
    const s = Number(since)
    ds = ds.filter(d => Date.parse(d.createdAt) > s)
  }
  res.json(ds)
})

router.get('/:id/settings', requireRole(['owner','operator']), (req, res) => {
  const found = getSettings(req.params.id)
  if (!found) return res.status(404).json({ error: 'not_found' })
  const available = ['mock']
  if (process.env.OPENAI_API_KEY) available.push('openai')
  res.json({ settings: found.settings, availableProviders: available })
})

router.put('/:id/settings', requireRole(['owner','operator']), (req, res) => {
  const { provider, systemPrompt, temperature, maxTokens } = req.body || {}
  if (provider && !['mock', 'openai'].includes(provider)) return res.status(422).json({ error: 'invalid' })
  if (temperature != null && (isNaN(temperature) || temperature < 0 || temperature > 2)) return res.status(422).json({ error: 'invalid' })
  if (maxTokens != null && (!Number.isInteger(maxTokens) || maxTokens <= 0)) return res.status(422).json({ error: 'invalid' })
  const updated = saveSettings(req.params.id, { provider, systemPrompt, temperature, maxTokens })
  if (!updated) return res.status(404).json({ error: 'not_found' })
  res.json({ settings: updated })
})

router.post('/', requireRole(['owner','operator']), (req, res) => {
  const { tenantId, title, initial = [] } = req.body || {}
  const db = readDb()
  const t = (db.tenants || []).find(tt => tt.id === tenantId)
  if (!t) return res.status(404).json({ error: 'not_found' })
  const id = nanoid()
  const chat = { id, subject: title || '', status: 'live', messages: [], drafts: [], updatedAt: new Date().toISOString(), agentState: 'idle', operatorTaken: false }
  for (const m of initial) {
    chat.messages.push({ id: nanoid(), role: m.role, text: m.text, ts: Date.now() })
  }
  t.chats = t.chats || []
  t.chats.push(chat)
  writeDb(db)
  res.status(201).json({ chatId: id })
})

router.post('/:id/messages', requireRole(['owner','operator']), (req, res) => {
  const { from, text } = req.body || {}
  const db = readDb()
  const found = findChat(db, req.params.id)
  if (!found) return res.status(404).json({ error: 'not_found' })
  const msg = { id: nanoid(), role: from, text, ts: Date.now() }
  found.chat.messages = found.chat.messages || []
  found.chat.messages.push(msg)
  found.chat.updatedAt = new Date().toISOString()
  writeDb(db)
  emit(found.tenant.id, { type: 'message:new', chatId: found.chat.id, message: msg })
  if (from === 'user' || from === 'client') scheduleDraft(found.chat.id, text)
  res.status(201).json(msg)
})

router.post('/:id/drafts', requireRole(['owner','operator']), (req, res) => {
  const { text } = req.body || {}
  const db = readDb()
  const found = findChat(db, req.params.id)
  if (!found) return res.status(404).json({ error: 'not_found' })
  const draft = { id: nanoid(), text, createdAt: new Date().toISOString() }
  found.chat.drafts = found.chat.drafts || []
  found.chat.drafts.push(draft)
  found.chat.updatedAt = draft.createdAt
  writeDb(db)
  emit(found.tenant.id, { type: 'draft:created', chatId: found.chat.id, draft })
  res.status(201).json(draft)
})

router.post('/:id/drafts/:draftId/approve', requireRole(['owner','operator']), (req, res) => {
  const db = readDb()
  const found = findChat(db, req.params.id)
  if (!found) return res.status(404).json({ error: 'not_found' })
  const idx = (found.chat.drafts || []).findIndex(d => d.id === req.params.draftId)
  if (idx === -1) return res.status(404).json({ error: 'not_found' })
  const draft = found.chat.drafts.splice(idx, 1)[0]
  const msg = { id: nanoid(), role: 'agent', text: draft.text, ts: Date.now() }
  found.chat.messages.push(msg)
  found.chat.updatedAt = new Date().toISOString()
  writeDb(db)
  emit(found.tenant.id, { type: 'draft:removed', chatId: found.chat.id, draftId: draft.id, reason: 'approved' })
  emit(found.tenant.id, { type: 'message:new', chatId: found.chat.id, message: msg })
  res.json({ message: msg })
})

router.post('/:id/drafts/:draftId/discard', requireRole(['owner','operator']), (req, res) => {
  const db = readDb()
  const found = findChat(db, req.params.id)
  if (!found) return res.status(404).json({ error: 'not_found' })
  const idx = (found.chat.drafts || []).findIndex(d => d.id === req.params.draftId)
  if (idx === -1) return res.status(404).json({ error: 'not_found' })
  found.chat.drafts.splice(idx, 1)
  found.chat.updatedAt = new Date().toISOString()
  writeDb(db)
  emit(found.tenant.id, { type: 'draft:removed', chatId: found.chat.id, draftId: req.params.draftId, reason: 'discarded' })
  res.json({ removed: true })
})

module.exports = router
