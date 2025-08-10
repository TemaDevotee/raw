const express = require('express');
const router = express.Router();
const { readDb, writeDb, ensureScopes } = require('../utils/db');

function getDraftsByChat(db, chatId) {
  db.draftsByChat = db.draftsByChat || {};
  return db.draftsByChat[chatId] || [];
}

router.get('/chats/:id/drafts', (req, res) => {
  const db = ensureScopes(readDb());
  const list = getDraftsByChat(db, req.params.id).filter((d) => d.state !== 'discarded');
  res.json(list);
});

function findDraft(db, chatId, draftId) {
  const list = getDraftsByChat(db, chatId);
  const idx = list.findIndex((d) => String(d.id) === String(draftId));
  return { list, idx };
}

router.post('/chats/:chatId/drafts/:draftId/approve', (req, res) => {
  const db = ensureScopes(readDb());
  const { list, idx } = findDraft(db, req.params.chatId, req.params.draftId);
  if (idx === -1) return res.status(404).send();
  const draft = list.splice(idx, 1)[0];
  db.chatDetails = db.chatDetails || {};
  if (!db.chatDetails[req.params.chatId]) db.chatDetails[req.params.chatId] = { id: req.params.chatId, messages: [] };
  const msg = { sender: 'agent', text: draft.text, time: new Date().toISOString(), visibility: 'public' };
  db.chatDetails[req.params.chatId].messages.push(msg);
  writeDb(db);
  res.json({ chatId: req.params.chatId, message: msg });
});

router.post('/chats/:chatId/drafts/:draftId/discard', (req, res) => {
  const db = ensureScopes(readDb());
  const { list, idx } = findDraft(db, req.params.chatId, req.params.draftId);
  if (idx === -1) return res.status(404).send();
  list.splice(idx, 1);
  writeDb(db);
  res.json({ ok: true });
});

// e2e seeding
function seedDrafts(map) {
  const db = ensureScopes(readDb());
  db.draftsByChat = map;
  writeDb(db);
}

module.exports = { router, seedDrafts };
