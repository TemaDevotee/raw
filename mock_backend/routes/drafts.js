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

router.post(['/chats/:chatId/drafts/:draftId/approve', '/chats/:chatId/drafts/:draftId/approve/'], (req, res) => {
  const db = ensureScopes(readDb());
  const { list, idx } = findDraft(db, req.params.chatId, req.params.draftId);
  let message;
  if (idx !== -1) {
    const draft = list.splice(idx, 1)[0];
    db.chatDetails = db.chatDetails || {};
    if (!db.chatDetails[req.params.chatId]) {
      db.chatDetails[req.params.chatId] = { id: req.params.chatId, messages: [] };
    }
    const now = Date.now();
    message = {
      id: `msg_${draft.id}`,
      chatId: req.params.chatId,
      role: 'agent',
      sender: 'agent',
      text: draft.text,
      ts: now,
      time: new Date(now).toISOString(),
      visibility: 'public'
    };
    db.chatDetails[req.params.chatId].messages.push(message);
    writeDb(db);
  }
  res.json(message ? { ok: true, message } : { ok: true });
});

const discardHandler = (req, res) => {
  const db = ensureScopes(readDb());
  const { list, idx } = findDraft(db, req.params.chatId, req.params.draftId);
  if (idx !== -1) {
    list.splice(idx, 1);
    writeDb(db);
  }
  res.json({ removed: true });
};

router.post(['/chats/:chatId/drafts/:draftId/discard', '/chats/:chatId/drafts/:draftId/discard/'], discardHandler);
router.delete(['/chats/:chatId/drafts/:draftId', '/chats/:chatId/drafts/:draftId/'], discardHandler);

module.exports = { router };
