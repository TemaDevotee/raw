const express = require('express');
const fs = require('fs');
const path = require('path');
const { emit } = require('../utils/eventBus');

const dbPath = path.join(__dirname, '../db.json');
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const writeDb = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

function findTenant(db) {
  return (db.tenants || [])[0];
}

const router = express.Router();

router.get('/', (_req, res) => {
  const db = readDb();
  const chats = [];
  for (const t of db.tenants || []) {
    for (const c of t.chats || []) {
      chats.push({ id: c.id, title: c.subject || '', updatedAt: c.updatedAt || 0 });
    }
  }
  res.json({ chats });
});

router.post('/', (req, res) => {
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(422).json({ error: 'title_required' });
  const db = readDb();
  let tenant = findTenant(db);
  if (!tenant) {
    tenant = { id: 'demo', chats: [] };
    db.tenants = [tenant];
  }
  const chat = { id: String(Date.now()), subject: title, updatedAt: Date.now(), messages: [] };
      tenant.chats = tenant.chats || [];
      tenant.chats.push(chat);
      writeDb(db);
      emit(tenant.id, { type: 'chat_created', chatId: chat.id, payload: { id: chat.id, title: chat.subject, updatedAt: chat.updatedAt } });
      res.status(201).json({ id: chat.id, title: chat.subject, updatedAt: chat.updatedAt });
});

router.get('/:id/transcript', (req, res) => {
  const db = readDb();
  for (const t of db.tenants || []) {
    const chat = (t.chats || []).find(c => c.id === req.params.id);
    if (chat) return res.json({ messages: chat.messages || [] });
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
      return res.json({ role: 'user', text });
    }
  }
  res.status(404).json({ error: 'not_found' });
});

router.post('/:id/agent', (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(422).json({ error: 'text_required' });
  const db = readDb();
  for (const t of db.tenants || []) {
    const chat = (t.chats || []).find(c => c.id === req.params.id);
    if (chat) {
      chat.messages = chat.messages || [];
      const msg = { id: String(Date.now()), role: 'agent', text, ts: Date.now() };
      chat.messages.push(msg);
      chat.updatedAt = Date.now();
      writeDb(db);
      emit(t.id, { type: 'message_posted', chatId: chat.id, payload: msg });
      return res.json({ text });
    }
  }
  res.status(404).json({ error: 'not_found' });
});

module.exports = router;
