const express = require('express');
const router = express.Router();
const { readDb, writeDb, ensureScopes } = require('../utils/db');

router.post('/seed', (req, res) => {
  const { chatId, drafts, payload } = req.body || {};
  if (!chatId) return res.status(400).json({ error: 'chatId required' });
  const db = ensureScopes(readDb());
  db.draftsByChat = db.draftsByChat || {};
  if (payload) {
    const draft = {
      id: payload.id || `seed-${Date.now()}`,
      chatId,
      author: 'agent',
      text: payload.text || '',
      createdAt: payload.createdAt || new Date().toISOString(),
      state: 'queued',
    };
    db.draftsByChat[chatId] = db.draftsByChat[chatId] || [];
    db.draftsByChat[chatId].push(draft);
    writeDb(db);
    return res.json({ ok: true, draft: { id: draft.id, text: draft.text } });
  } else {
    db.draftsByChat[chatId] = (drafts || []).map((d, i) => ({
      id: d.id || `seed-${i}`,
      chatId,
      author: 'agent',
      text: d.text || '',
      createdAt: d.createdAt || new Date().toISOString(),
      state: 'queued',
    }));
    writeDb(db);
    return res.json({ ok: true, drafts: db.draftsByChat[chatId].map((d) => ({ id: d.id, text: d.text })) });
  }
});

router.get('/', (req, res) => {
  const { chatId } = req.query || {};
  const db = ensureScopes(readDb());
  const list = db.draftsByChat && chatId ? db.draftsByChat[chatId] || [] : [];
  res.json(list);
});

module.exports = router;
