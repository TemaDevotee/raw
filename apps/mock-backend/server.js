import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import {
  state,
  touch,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  setAutosave,
  seedDemoData,
  issueToken,
  getUserByToken,
  resetState,
} from './db.js';
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

function requireAuth(req, res, next) {
  const auth = req.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  const user = getUserByToken(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  req.tenant = state.tenants.find((t) => t.id === user.tenantId);
  next();
}

seedDemoData(process.env.FRESH === '1');

// Auth
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = state.users.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = issueToken(user.id);
  const tenant = state.tenants.find((t) => t.id === user.tenantId);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, tenantId: user.tenantId }, tenant });
});

app.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username, role: req.user.role, tenantId: req.user.tenantId }, tenant: req.tenant });
});

// Dev routes
app.post('/admin/dev/seed', requireAdmin, (req, res) => {
  const fresh = req.query.fresh === '1' || req.body?.fresh;
  const summary = seedDemoData(fresh);
  res.json(summary);
});

app.post('/admin/dev/reset', requireAdmin, (_req, res) => {
  const summary = seedDemoData(true);
  res.json(summary);
});

app.post('/admin/dev/impersonate', requireAdmin, (req, res) => {
  const { username } = req.body || {};
  const user = state.users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const token = issueToken(user.id);
  const tenant = state.tenants.find((t) => t.id === user.tenantId);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, tenantId: user.tenantId }, tenant });
});

// SSE
app.get('/api/sse/:tenantId?', requireAuth, sseHandler);

// Chats
app.post('/api/chats', requireAuth, (req, res) => {
  const { title = '', agentId = '' } = req.body || {};
  const chat = { id: nanoid(), tenantId: req.user.tenantId, title, agentId, createdByUserId: req.user.id, createdAt: Date.now() };
  state.chats.push(chat);
  touch({ type: 'chat:create', chat });
  res.json(chat);
});

app.get('/api/chats', requireAuth, (req, res) => {
  const list = state.chats.filter((c) => c.tenantId === req.user.tenantId);
  res.json(list);
});

app.get('/api/chats/:id/transcript', requireAuth, (req, res) => {
  const chat = state.chats.find((c) => c.id === req.params.id && c.tenantId === req.user.tenantId);
  if (!chat) return res.status(404).end();
  const since = Number(req.query.since || 0);
  const messages = state.messages.filter((m) => m.chatId === chat.id && m.createdAt > since);
  const drafts = state.drafts.filter((d) => d.chatId === chat.id && d.createdAt > since);
  res.json({ messages, drafts });
});

app.post('/api/chats/:id/messages', requireAuth, (req, res) => {
  const chat = state.chats.find((c) => c.id === req.params.id && c.tenantId === req.user.tenantId);
  if (!chat) return res.status(404).end();
  const { role, text } = req.body;
  const message = { id: nanoid(), chatId: chat.id, role, text, createdAt: Date.now() };
  state.messages.push(message);
  touch({ type: 'message', message });
  push(chat.tenantId, 'chat', { chatId: chat.id, message });
  res.json(message);
});

// Drafts
app.post('/api/chats/:id/drafts', requireAuth, (req, res) => {
  const chat = state.chats.find((c) => c.id === req.params.id && c.tenantId === req.user.tenantId);
  if (!chat) return res.status(404).end();
  const draft = { id: nanoid(), chatId: chat.id, text: req.body.text, createdAt: Date.now(), status: 'pending' };
  state.drafts.push(draft);
  touch({ type: 'draft:create', draft });
  push(chat.tenantId, 'draft', { chatId: chat.id, draft, action: 'create' });
  res.json(draft);
});

app.post('/api/chats/:id/drafts/approve', requireAuth, (req, res) => {
  const chat = state.chats.find((c) => c.id === req.params.id && c.tenantId === req.user.tenantId);
  if (!chat) return res.status(404).end();
  const idx = state.drafts.findIndex((d) => d.id === req.body.draftId && d.chatId === chat.id);
  if (idx === -1) return res.status(404).end();
  const draft = state.drafts.splice(idx, 1)[0];
  const message = { id: nanoid(), chatId: chat.id, role: 'agent', text: draft.text, createdAt: Date.now() };
  state.messages.push(message);
  touch({ type: 'draft:approve', draftId: draft.id });
  push(chat.tenantId, 'draft', { chatId: chat.id, draftId: draft.id, action: 'approve' });
  push(chat.tenantId, 'chat', { chatId: chat.id, message });
  res.json(message);
});

app.post('/api/chats/:id/drafts/discard', requireAuth, (req, res) => {
  const chat = state.chats.find((c) => c.id === req.params.id && c.tenantId === req.user.tenantId);
  if (!chat) return res.status(404).end();
  const idx = state.drafts.findIndex((d) => d.id === req.body.draftId && d.chatId === chat.id);
  if (idx === -1) return res.status(404).end();
  state.drafts.splice(idx, 1);
  touch({ type: 'draft:discard', draftId: req.body.draftId });
  push(chat.tenantId, 'draft', { chatId: chat.id, draftId: req.body.draftId, action: 'discard' });
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
