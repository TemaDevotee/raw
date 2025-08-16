import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import path from 'path';
import { state, touch, saveSnapshot, loadSnapshot, listSnapshots, resetState, setAutosave } from './db.js';
import { sseHandler, push } from './sse.js';

const app = express();
const port = process.env.PORT || 5174;
const ADMIN_KEY = process.env.VITE_ADMIN_KEY || 'dev-admin-key';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

function requireAdmin(req, res, next) {
  const key = req.get('X-Admin-Key');
  if (key && key === ADMIN_KEY) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

// SSE
app.get('/api/sse/:tenantId?', sseHandler);

// Chats
app.post('/api/chats', (req, res) => {
  const { tenantId = 'global', title = '' } = req.body || {};
  const chat = { id: nanoid(), tenantId, title, createdAt: Date.now() };
  state.chats.push(chat);
  touch({ type: 'chat:create', chat });
  res.json(chat);
});

app.get('/api/chats', (req, res) => {
  const { tenantId } = req.query;
  const list = tenantId ? state.chats.filter(c => c.tenantId === tenantId) : state.chats;
  res.json(list);
});

app.get('/api/chats/:id/transcript', (req, res) => {
  const since = Number(req.query.since || 0);
  const id = req.params.id;
  const messages = state.messages.filter(m => m.chatId === id && m.createdAt > since);
  const drafts = state.drafts.filter(d => d.chatId === id && d.createdAt > since);
  res.json({ messages, drafts });
});

app.post('/api/chats/:id/messages', (req, res) => {
  const chatId = req.params.id;
  const { role, text } = req.body;
  const message = { id: nanoid(), chatId, role, text, createdAt: Date.now() };
  state.messages.push(message);
  touch({ type: 'message', message });
  const chat = state.chats.find(c => c.id === chatId);
  push(chat?.tenantId || 'global', 'chat', { chatId, message });
  res.json(message);
});

// Drafts
app.post('/api/chats/:id/drafts', (req, res) => {
  const chatId = req.params.id;
  const draft = { id: nanoid(), chatId, text: req.body.text, createdAt: Date.now() };
  state.drafts.push(draft);
  touch({ type: 'draft:create', draft });
  const chat = state.chats.find(c => c.id === chatId);
  push(chat?.tenantId || 'global', 'draft', { chatId, draft, action: 'create' });
  res.json(draft);
});

app.post('/api/chats/:id/drafts/approve', (req, res) => {
  const chatId = req.params.id;
  const { draftId } = req.body;
  const idx = state.drafts.findIndex(d => d.id === draftId && d.chatId === chatId);
  if (idx === -1) return res.status(404).end();
  const draft = state.drafts.splice(idx, 1)[0];
  const message = { id: nanoid(), chatId, role: 'agent', text: draft.text, createdAt: Date.now() };
  state.messages.push(message);
  touch({ type: 'draft:approve', draftId });
  const chat = state.chats.find(c => c.id === chatId);
  push(chat?.tenantId || 'global', 'draft', { chatId, draftId, action: 'approve' });
  push(chat?.tenantId || 'global', 'chat', { chatId, message });
  res.json(message);
});

app.post('/api/chats/:id/drafts/discard', (req, res) => {
  const chatId = req.params.id;
  const { draftId } = req.body;
  const idx = state.drafts.findIndex(d => d.id === draftId && d.chatId === chatId);
  if (idx === -1) return res.status(404).end();
  state.drafts.splice(idx, 1);
  touch({ type: 'draft:discard', draftId });
  const chat = state.chats.find(c => c.id === chatId);
  push(chat?.tenantId || 'global', 'draft', { chatId, draftId, action: 'discard' });
  res.json({ ok: true });
});

// Admin DB utilities
app.post('/admin/db/save', requireAdmin, (req, res) => {
  const name = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0] + '.json';
  const file = saveSnapshot(name);
  res.json({ saved: path.basename(file) });
});

app.post('/admin/db/load', requireAdmin, (req, res) => {
  loadSnapshot(req.body.name);
  res.json({ loaded: req.body.name });
});

app.post('/admin/db/reset', requireAdmin, (_req, res) => {
  resetState();
  res.json({ ok: true });
});

app.get('/admin/db/list', requireAdmin, (_req, res) => {
  res.json(listSnapshots());
});

app.post('/admin/db/autosave', requireAdmin, (req, res) => {
  const enabled = setAutosave(req.body.enabled);
  res.json({ enabled });
});

// Dummy admin endpoints
app.all('/admin/knowledge/*', requireAdmin, (_req, res) => res.json({ ok: true }));
app.all('/admin/billing/*', requireAdmin, (_req, res) => res.json({ ok: true }));
app.all('/admin/chats/*', requireAdmin, (_req, res) => res.json({ ok: true }));

app.listen(port, () => {
  console.log(`Mock backend listening on ${port}`);
});
