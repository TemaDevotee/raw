const express = require('express');
const fs = require('fs');
const path = require('path');
const { emit } = require('../utils/eventBus');

const dbPath = path.join(__dirname, '../db.json');
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const writeDb = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

const router = express.Router();

router.get('/:id/transcript', (req, res) => {
  const since = req.query.since ? Number(req.query.since) : null;
  const db = readDb();
  for (const t of db.tenants || []) {
    const chat = (t.chats || []).find(c => c.id === req.params.id);
    if (chat) {
      let messages = chat.messages || [];
      if (since) {
        messages = messages.filter(m => Number(m.ts) > since);
      }
      const lastTs = messages.length
        ? Math.max(...messages.map(m => Number(m.ts)))
        : since;
      return res.json({ messages, lastTs });
    }
  }
  res.status(404).json({ error: 'not_found' });
});

router.post('/:id/messages', (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(422).json({ error: 'text_required' });
  const db = readDb();
  for (const t of db.tenants || []) {
    const chat = (t.chats || []).find(c => c.id === req.params.id);
    if (chat) {
      chat.messages = chat.messages || [];
      const msg = { id: String(Date.now()), role: 'user', text, ts: Date.now() };
      chat.messages.push(msg);
      chat.updatedAt = Date.now();
      writeDb(db);
      emit(t.id, { type: 'message_posted', chatId: chat.id, payload: msg });
      return res.json(msg);
    }
  }
  res.status(404).json({ error: 'not_found' });
});

module.exports = router;
