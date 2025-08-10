const express = require('express');
const router = express.Router();
const { readDb, writeDb, ensureScopes } = require('../utils/db');

// Return list of chat summaries.  When a workspaceId query param is
// provided the chats scoped to that workspace are returned.  Fallback
// to the legacy top‑level chats array for backward compatibility.
router.get('/', (req, res) => {
  const db = ensureScopes(readDb());
  const wsId = req.query.workspaceId;
  if (wsId && db.chatsByWs && db.chatsByWs[wsId]) {
    return res.json(db.chatsByWs[wsId]);
  }
  return res.json(db.chats || []);
});

// Return detailed conversation by id.  Chat transcripts live under
// `chatDetails` in the database.
router.get('/:id', (req, res) => {
  const db = ensureScopes(readDb());
  const details = db.chatDetails && db.chatDetails[req.params.id];
  if (!details) {
    return res.status(404).send();
  }
  details.controlBy = db.chatControl?.[req.params.id] || 'agent';
  details.heldBy = db.chatHeldBy?.[req.params.id] || null;
  res.json(details);
});

// Append a message to a chat conversation.  Accepts { sender, text, time }
router.post('/:id/messages', (req, res) => {
  const db = ensureScopes(readDb());
  const chatId = req.params.id;
  const { sender, text, time } = req.body;
  if (!db.chatDetails || !db.chatDetails[chatId]) {
    return res.status(404).send();
  }
  const message = {
    sender,
    text,
    time: time || new Date().toLocaleTimeString(),
  };
  db.chatDetails[chatId].messages.push(message);
  // Also update the summary record either in scoped or top‑level list
  const updateSummary = (list) => {
    const idx = list.findIndex((c) => String(c.id) === String(chatId));
    if (idx !== -1) {
      list[idx].lastMessage = text;
      list[idx].time = 'now';
    }
  };
  const wsId = req.query.workspaceId;
  if (wsId && db.chatsByWs && db.chatsByWs[wsId]) {
    updateSummary(db.chatsByWs[wsId]);
  } else {
    updateSummary(db.chats || []);
  }
  writeDb(db);
  res.status(201).json(message);
});

// Utility function to update a chat's status in the summary lists.  Looks up the
// chat in either the workspace-scoped list (chatsByWs) or the legacy top-level
// chats array and mutates the status field if found.
function updateChatStatus(db, chatId, status, wsId) {
  const updateStatus = (list) => {
    const idx = list.findIndex((c) => String(c.id) === String(chatId));
    if (idx !== -1) list[idx].status = status;
  };
  if (wsId && db.chatsByWs && db.chatsByWs[wsId]) {
    updateStatus(db.chatsByWs[wsId]);
  } else {
    updateStatus(db.chats || []);
  }
}

// Operator interferes with a chat: sets status to live and sends system message.
router.post('/:id/interfere', (req, res) => {
  const db = ensureScopes(readDb());
  const chatId = req.params.id;
  const wsId = req.query.workspaceId;
  // Ensure structures
  db.chatDetails = db.chatDetails || {};
  if (!db.chatDetails[chatId]) db.chatDetails[chatId] = { id: chatId, messages: [] };
  db.chatControl = db.chatControl || {};
  db.chatHeldBy = db.chatHeldBy || {};
  db.chatControl[chatId] = 'operator';
  db.chatHeldBy[chatId] = req.body?.operatorId || '1';
  // Log system message
  db.chatDetails[chatId].messages.push({
    sender: 'system',
    text: 'Operator took control. Agent paused.',
    time: new Date().toLocaleTimeString(),
  });
  // Update status on summary list
  updateChatStatus(db, chatId, 'live', wsId);
  writeDb(db);
  return res.status(200).json({ controlBy: 'operator', heldBy: db.chatHeldBy[chatId], status: 'live' });
});

// Resolve the chat issue: record resolution message and set status to resolved.
router.post('/:id/resolve', (req, res) => {
  const db = ensureScopes(readDb());
  const chatId = req.params.id;
  const wsId = req.query.workspaceId;
  if (!db.chatDetails || !db.chatDetails[chatId]) {
    return res.status(404).send();
  }
  db.chatDetails[chatId].messages.push({
    sender: 'system',
    text: 'The issue has been resolved.',
    time: new Date().toLocaleTimeString(),
  });
  updateChatStatus(db, chatId, 'resolved', wsId);
  writeDb(db);
  return res.status(200).json({ status: 'resolved' });
});

// End the chat: record end message and set status to ended.
router.post('/:id/end', (req, res) => {
  const db = ensureScopes(readDb());
  const chatId = req.params.id;
  const wsId = req.query.workspaceId;
  if (!db.chatDetails || !db.chatDetails[chatId]) {
    return res.status(404).send();
  }
  db.chatDetails[chatId].messages.push({
    sender: 'system',
    text: 'Chat ended by operator.',
    time: new Date().toLocaleTimeString(),
  });
  updateChatStatus(db, chatId, 'ended', wsId);
  writeDb(db);
  return res.status(200).json({ status: 'ended' });
});


// Return control to AI agent: set status back to attention and record system message.
router.post('/:id/return', (req, res) => {
  const db = ensureScopes(readDb());
  const chatId = req.params.id;
  const wsId = req.query.workspaceId;
  db.chatDetails = db.chatDetails || {};
  if (!db.chatDetails[chatId]) db.chatDetails[chatId] = { id: chatId, messages: [] };
  db.chatControl = db.chatControl || {};
  db.chatHeldBy = db.chatHeldBy || {};
  db.chatControl[chatId] = 'agent';
  db.chatHeldBy[chatId] = null;
  db.chatDetails[chatId].messages.push({
    sender: 'system',
    text: 'Operator returned control to the agent.',
    time: new Date().toLocaleTimeString(),
  });
  updateChatStatus(db, chatId, 'attention', wsId);
  writeDb(db);
  return res.status(200).json({ controlBy: 'agent', heldBy: null, status: 'attention' });
});

// Generic status change endpoint
router.patch('/:id/status', (req, res) => {
  const db = ensureScopes(readDb());
  const chatId = req.params.id;
  const { status } = req.body || {};
  const allowed = ['live','paused','attention','resolved','ended','idle'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const updateStatus = (list) => {
    const idx = list.findIndex((c) => String(c.id) === String(chatId));
    if (idx !== -1) list[idx].status = status;
  };
  const wsId = req.query.workspaceId;
  if (wsId && db.chatsByWs && db.chatsByWs[wsId]) {
    updateStatus(db.chatsByWs[wsId]);
  } else {
    updateStatus(db.chats || []);
  }
  // Add a small system note
  if (db.chatDetails && db.chatDetails[chatId]) {
    db.chatDetails[chatId].messages.push({
      sender: 'system',
      text: `Status changed to ${status}.`,
      time: new Date().toLocaleTimeString(),
    });
  }
  writeDb(db);
  res.json({ status });
});

module.exports = router;