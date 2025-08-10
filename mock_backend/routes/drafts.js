const express = require('express');
const router = express.Router();
const { readDb, writeDb, ensureScopes } = require('../utils/db');

// list drafts for a chat
router.get('/list/:chatId', (req, res) => {
  const db = ensureScopes(readDb());
  const chatId = req.params.chatId;
  db.draftsByChat = db.draftsByChat || {};
  const list = db.draftsByChat[chatId] || [];
  res.json(list.filter((d) => d.state !== 'discarded'));
});

function findDraft(db, id) {
  db.draftsByChat = db.draftsByChat || {};
  for (const [cid, arr] of Object.entries(db.draftsByChat)) {
    const idx = arr.findIndex((d) => String(d.id) === String(id));
    if (idx !== -1) return { chatId: cid, draft: arr[idx], index: idx, list: arr };
  }
  return null;
}

router.post('/approve/:id', (req, res) => {
  const db = ensureScopes(readDb());
  const found = findDraft(db, req.params.id);
  if (!found) return res.status(404).send();
  const { chatId, draft, list, index } = found;
  list.splice(index, 1);
  db.chatDetails = db.chatDetails || {};
  if (!db.chatDetails[chatId]) db.chatDetails[chatId] = { id: chatId, messages: [] };
  const message = {
    sender: 'agent',
    text: draft.text,
    time: new Date().toLocaleTimeString(),
    visibility: 'public',
  };
  db.chatDetails[chatId].messages.push(message);
  writeDb(db);
  res.json({ chatId, message });
});

router.post('/discard/:id', (req, res) => {
  const db = ensureScopes(readDb());
  const found = findDraft(db, req.params.id);
  if (!found) return res.status(404).send();
  const { list, index } = found;
  list.splice(index, 1);
  writeDb(db);
  res.status(200).json({ ok: true });
});

module.exports = router;
