const express = require('express')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '../db.json')
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
const writeDb = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))

const router = express.Router()

router.get('/', (_req, res) => {
  const db = readDb()
  const chats = []
  for (const t of db.tenants || []) {
    for (const c of t.chats || []) {
      const last = (c.messages || []).slice(-1)[0]
      chats.push({ id: c.id, title: c.subject || '', lastMessageAt: last ? last.ts : 0 })
    }
  }
  res.json(chats)
})

router.get('/:id/transcript', (req, res) => {
  const db = readDb()
  for (const t of db.tenants || []) {
    const chat = (t.chats || []).find(c => c.id === req.params.id)
    if (chat) return res.json(chat.messages || [])
  }
  res.status(404).json({ error: 'not_found' })
})

router.post('/:id/messages', (req, res) => {
  const { role, text } = req.body || {}
  const db = readDb()
  for (const t of db.tenants || []) {
    const chat = (t.chats || []).find(c => c.id === req.params.id)
    if (chat) {
      chat.messages = chat.messages || []
      chat.messages.push({ role, text, ts: Date.now() })
      writeDb(db)
      return res.json({ ok: true })
    }
  }
  res.status(404).json({ error: 'not_found' })
})

module.exports = router
