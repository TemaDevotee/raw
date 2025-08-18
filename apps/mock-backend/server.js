import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { db } from './db.js';
import { seedDemo } from './seed/demoTenants.js';
import { estimateTokens, chargeMessage, ensureReset } from './services/billing.js';
import { registerBillingRoutes } from './routes/billing.js';
import { registerSimulatorRoutes } from './routes/simulator.js';
import { getQuery, getBody, toNumber, toBool, reqId } from './utils/req.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
require('dotenv').config();

export const app = express();
const MOCK_PORT = Number(process.env.MOCK_PORT) || 3001;
const STUDIO_PORT = Number(process.env.STUDIO_PORT) || 5199;
const ADMIN_KEY = process.env.VITE_ADMIN_KEY || 'dev-admin-key';
const JWT_SECRET = process.env.MOCK_JWT_SECRET || 'dev-secret-please-change';
const { json } = require('express');

const userIndex = new Map(); // email -> user

function buildUserIndex() {
  userIndex.clear();
  for (const u of db.users) {
    userIndex.set(u.email, u);
  }
}

// seeds are triggered via scripts; just build index on start
buildUserIndex();

app.use(cors({ origin: [/^http:\/\/localhost:\d+$/], credentials: true }));

app.use(json({ limit: '5mb' }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/avatars', express.static(path.join(__dirname, 'public/avatars')));
app.use('/files', express.static(path.resolve('.mockdb/files')));

function requireAdmin(req, res, next) {
  const key = req.get('X-Admin-Key');
  if (key && key === ADMIN_KEY) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

function getTenant(req, res) {
  const q = getQuery(req);
  const slug = q.tenant;
  const current = req.tenantId;
  if (slug && slug !== current) {
    res.status(403).json({ error: 'forbidden' });
    return null;
  }
  const tenant = db.tenants.find((t) => t.slug === current);
  if (!tenant) {
    res.status(404).json({ error: 'tenant_not_found' });
    return null;
  }
  tenant._cursors = tenant._cursors || {};
  return tenant;
}

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  const [header, body, sig] = token.split('.');
  if (!header || !body || !sig) return null;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (expected !== sig) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    return null;
  }
}

app.post('/auth/login', (req, res) => {
  const body = getBody(req);
  const { email, password } = body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password required' });
  }
  const user = userIndex.get(email);
  if (!user || user.password !== password || !user.isActive) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const tenantId = user.memberships[0]?.tenantId;
  const token = signToken({ userId: user.id, tenantId });
  const tenants = user.memberships.map((m) => ({
    id: m.tenantId,
    name: db.tenants.find((t) => t.slug === m.tenantId)?.name || m.tenantId,
    role: m.role,
  }));
  res.json({ token, user: { id: user.id, email: user.email, name: user.name }, tenants, currentTenantId: tenantId });
});

function authMiddleware(req, res, next) {
  const header = req.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'invalid_token' });
  const user = db.users.find((u) => u.id === payload.userId);
  if (!user || !user.isActive) return res.status(401).json({ error: 'invalid_token' });
  req.user = user;
  req.tenantId = payload.tenantId;
  next();
}

app.get('/auth/me', authMiddleware, (req, res) => {
  const tenants = req.user.memberships.map((m) => ({
    id: m.tenantId,
    name: db.tenants.find((t) => t.slug === m.tenantId)?.name || m.tenantId,
    role: m.role,
  }));
  res.json({
    user: { id: req.user.id, email: req.user.email, name: req.user.name },
    tenants,
    currentTenantId: req.tenantId,
    isImpersonating: false,
  });
});

app.post('/auth/switch-tenant', authMiddleware, (req, res) => {
  const body = getBody(req);
  const { tenantId } = body;
  if (!tenantId) return res.status(400).json({ message: 'tenantId required' });
  const membership = req.user.memberships.find((m) => m.tenantId === tenantId);
  if (!membership) return res.status(403).json({ error: 'forbidden' });
  const token = signToken({ userId: req.user.id, tenantId });
  const tenants = req.user.memberships.map((m) => ({
    id: m.tenantId,
    name: db.tenants.find((t) => t.slug === m.tenantId)?.name || m.tenantId,
    role: m.role,
  }));
  res.json({ token, currentTenantId: tenantId, tenants });
});

app.post('/auth/logout', authMiddleware, (_req, res) => {
  res.json({ ok: true });
});

app.get('/', (_req, res) => res.json({ ok: true }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.post('/admin/dev/reseed', requireAdmin, (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end();
  const result = seedDemo(db, { writeFiles: true });
  buildUserIndex();
  res.json(result);
});

app.get('/admin/dev/tenants', requireAdmin, (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end();
  const list = db.tenants.map((t) => {
    const fileCount = t.knowledge.collections.reduce((a, c) => a + c.files.length, 0);
    return {
      slug: t.slug,
      name: t.name,
      plan: t.plan,
      quotas: t.quotas,
      usage: t.usage,
      counts: { chats: t.chats.length, messages: t.messages.length, files: fileCount },
    };
  });
  res.json(list);
});

// Chat endpoints

app.get('/admin/agents', authMiddleware, requireAdmin, (req, res) => {
  const tenant = getTenant(req, res);
  if (!tenant) return;
  const items = tenant.agents.map((a) => ({ id: a.id, name: a.name, avatarUrl: a.avatarUrl }));
  res.json({ items });
});

app.get('/admin/knowledge/files', authMiddleware, requireAdmin, (req, res) => {
  const tenant = getTenant(req, res);
  if (!tenant) return;
  const collection = tenant.knowledge.collections[0];
  res.json({ items: collection ? collection.files : [] });
});

app.get('/admin/users', authMiddleware, requireAdmin, (req, res) => {
  const tenant = getTenant(req, res);
  if (!tenant) return;
  const items = db.users
    .filter((u) => u.memberships.some((m) => m.tenantId === tenant.slug))
    .map((u) => {
      const m = u.memberships.find((m) => m.tenantId === tenant.slug);
      return { id: u.id, email: u.email, name: u.name, role: m.role, isActive: u.isActive };
    });
  res.json({ items });
});

app.get('/admin/chats', authMiddleware, requireAdmin, (req, res) => {
  const tenant = getTenant(req, res);
  if (!tenant) return;
  let items = tenant.chats.slice();
  const q = getQuery(req);
  const status = q.status;
  const search = q.q;
  const limit = toNumber(q.limit, 30);
  const cursor = q.cursor !== undefined ? toNumber(q.cursor) : null;
  if (status) {
    const statuses = String(status).split(',');
    items = items.filter((c) => statuses.includes(c.status));
  }
  if (search) {
    const s = String(search).toLowerCase();
    items = items.filter((c) => {
      const agentName = c.participants.agentId
        ? tenant.agents.find((a) => a.id === c.participants.agentId)?.name || ''
        : '';
      return (
        c.title.toLowerCase().includes(s) ||
        c.participants.clientName.toLowerCase().includes(s) ||
        agentName.toLowerCase().includes(s)
      );
    });
  }
  items.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  let filtered = items;
  if (cursor) {
    filtered = items.filter((c) => c.lastMessageAt < cursor);
  }
  const page = filtered.slice(0, limit + 1);
  const next = page.length > limit ? page.pop().lastMessageAt : null;
  res.json({ items: page, nextCursor: next });
});

app.post('/admin/chats', authMiddleware, requireAdmin, (req, res) => {
  const tenant = getTenant(req, res);
  if (!tenant) return;
  const body = getBody(req);
  const { title, clientName } = body;
  const agentId = body.agentId !== undefined ? body.agentId : null;
  const workspaceId = body.workspaceId !== undefined ? body.workspaceId : null;
  if (!title || !clientName) return res.status(400).json({ error: 'invalid_payload' });
  const id = nanoid();
  const chat = {
    id,
    title,
    status: 'attention',
    participants: { clientName, agentId },
    presence: { operators: [] },
    control: { mode: 'agent', ownerUserId: null, since: Date.now() },
    lastMessageAt: Date.now(),
    workspaceId,
  };
  tenant.chats.push(chat);
  const cursor = (tenant._cursors[id] || 0) + 1;
  tenant._cursors[id] = cursor;
  tenant.messages.push({ id: nanoid(), chatId: id, role: 'system', text: 'Chat created', ts: Date.now(), cursor });
  res.status(201).json(chat);
});

app.get('/admin/chats/:id', authMiddleware, requireAdmin, (req, res) => {
  const tenant = getTenant(req, res);
  if (!tenant) return;
  const id = reqId(req);
  const chat = tenant.chats.find((c) => c.id === id);
  if (!chat) return res.status(404).json({ error: 'not_found' });
  res.json(chat);
});

app.patch('/admin/chats/:id', authMiddleware, requireAdmin, (req, res) => {
  const tenant = getTenant(req, res);
  if (!tenant) return;
  const id = reqId(req);
  const chat = tenant.chats.find((c) => c.id === id);
  if (!chat) return res.status(404).json({ error: 'not_found' });
  const body = getBody(req);
  const { status, title, workspaceId, agentId } = body;
  if (status) {
    const allowed = ['live', 'paused', 'attention', 'resolved', 'ended'];
    if (!allowed.includes(status)) return res.status(422).json({ error: 'invalid_status' });
    if (chat.status === status) return res.status(422).json({ error: 'invalid_status' });
    if (chat.status === 'ended') return res.status(409).json({ error: 'chat_final' });
    chat.status = status;
    if (status === 'ended') {
      chat.presence.operators = [];
      if (chat.control.mode === 'operator') {
        chat.control = { mode: 'agent', ownerUserId: null, since: Date.now() };
      }
    }
  }
  if (title) chat.title = title;
  if (workspaceId !== undefined) chat.workspaceId = workspaceId;
  if (agentId !== undefined) chat.participants.agentId = agentId;
  res.json(chat);
});

app.post('/admin/chats/:id/messages', authMiddleware, requireAdmin, (req, res) => {
  const tenant = getTenant(req, res);
  if (!tenant) return;
  const id = reqId(req);
  const chat = tenant.chats.find((c) => c.id === id);
  if (!chat) return res.status(404).json({ error: 'not_found' });
  const body = getBody(req);
  const { role, text } = body;
  const draft = toBool(body.draft);
  if (!role || !text || !text.trim()) return res.status(400).json({ error: 'invalid_payload' });
  if (text.length > 10000) return res.status(422).json({ error: 'text_too_long' });
  let isDraft = draft;
  if (role === 'agent') {
    if (chat.control.mode === 'operator') {
      isDraft = true;
    } else if (chat.participants.agentId) {
      const agent = tenant.agents.find((a) => a.id === chat.participants.agentId);
      if (agent && agent.approveMode === 'manual') isDraft = true;
    }
  }
  const tokens = estimateTokens(text);
  ensureReset(tenant);
  if (role === 'agent') {
    if (tenant.billing.tokenBalance < tokens) {
      return res.status(402).json({ code: 'TOKEN_BALANCE_EXCEEDED', needed: tokens, balance: tenant.billing.tokenBalance });
    }
  }
  const cursor = (tenant._cursors[chat.id] || 0) + 1;
  tenant._cursors[chat.id] = cursor;
  const now = Date.now();
  const msgId = nanoid();
  const msg = {
    id: msgId,
    chatId: chat.id,
    role,
    text,
    ts: now,
    cursor,
    draft: isDraft || undefined,
    approvedAt: null,
    discardedAt: null,
    deliveredAt: isDraft ? null : now,
  };
  tenant.messages.push(msg);
  chat.lastMessageAt = now;
  tenant.usage.tokensUsed += tokens;
  if (role === 'agent') {
    chargeMessage(tenant, {
      chatId: chat.id,
      agentId: chat.participants.agentId,
      messageId: msgId,
      role,
      text,
      draft: isDraft,
    });
  }
  res.status(201).json(msg);
});

app.post(
  '/admin/chats/:chatId/messages/:messageId/approve',
  authMiddleware,
  requireAdmin,
  (req, res) => {
    const tenant = getTenant(req, res);
    if (!tenant) return;
    const chat = tenant.chats.find((c) => c.id === req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'not_found' });
    const msg = tenant.messages.find(
      (m) => m.id === req.params.messageId && m.chatId === chat.id,
    );
    if (!msg || !msg.draft || msg.discardedAt) {
      return res.status(422).json({ error: 'not_draft' });
    }
    if (chat.control.mode === 'operator') {
      if (chat.control.ownerUserId !== req.user.id)
        return res.status(403).json({ error: 'not_owner' });
    } else {
      const agent = chat.participants.agentId
        ? tenant.agents.find((a) => a.id === chat.participants.agentId)
        : null;
      if (!agent || agent.approveMode !== 'manual')
        return res.status(403).json({ error: 'forbidden' });
    }
    const now = Date.now();
    Object.assign(msg, { draft: false, approvedAt: now, deliveredAt: now });
    chat.lastMessageAt = now;
    res.json(msg);
  },
);

app.post(
  '/admin/chats/:chatId/messages/:messageId/discard',
  authMiddleware,
  requireAdmin,
  (req, res) => {
    const tenant = getTenant(req, res);
    if (!tenant) return;
    const chat = tenant.chats.find((c) => c.id === req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'not_found' });
    const msg = tenant.messages.find(
      (m) => m.id === req.params.messageId && m.chatId === chat.id,
    );
    if (!msg || !msg.draft || msg.discardedAt) {
      return res.status(422).json({ error: 'not_draft' });
    }
    if (chat.control.mode === 'operator') {
      if (chat.control.ownerUserId !== req.user.id)
        return res.status(403).json({ error: 'not_owner' });
    } else {
      const agent = chat.participants.agentId
        ? tenant.agents.find((a) => a.id === chat.participants.agentId)
        : null;
      if (!agent || agent.approveMode !== 'manual')
        return res.status(403).json({ error: 'forbidden' });
    }
    msg.discardedAt = Date.now();
    res.json({ ok: true });
  },
);

app.get('/admin/chats/:id/transcript', authMiddleware, requireAdmin, (req, res) => {
  const tenant = getTenant(req, res);
  if (!tenant) return;
  const id = reqId(req);
  const chat = tenant.chats.find((c) => c.id === id);
  if (!chat) return res.status(404).json({ error: 'not_found' });
  const q = getQuery(req);
  const since = q.since !== undefined ? toNumber(q.since) : undefined;
  const limit = toNumber(q.limit, 50);
  const includeDiscarded = toBool(q.includeDiscarded);
  let items = tenant.messages.filter(
    (m) => m.chatId === chat.id && (includeDiscarded || !m.discardedAt),
  );
  if (since !== undefined) {
    items = items.filter((m) => m.cursor > since);
  } else {
    items = items.sort((a, b) => b.ts - a.ts).slice(0, limit);
  }
  items.sort((a, b) => a.ts - b.ts);
  const lastCursor = items.length ? items[items.length - 1].cursor : tenant._cursors[chat.id] || 0;
  res.json({ items, lastCursor });
});

app.get('/public/chats/:id/transcript', (req, res) => {
  const q = getQuery(req);
  const slug = q.tenant;
  const tenant = db.tenants.find((t) => t.slug === slug);
  if (!tenant) return res.status(404).json({ error: 'tenant_not_found' });
  const id = reqId(req);
  const chat = tenant.chats.find((c) => c.id === id);
  if (!chat) return res.status(404).json({ error: 'not_found' });
  const since = q.since !== undefined ? toNumber(q.since) : undefined;
  const limit = toNumber(q.limit, 50);
  let items = tenant.messages.filter(
    (m) => m.chatId === chat.id && m.draft !== true && !m.discardedAt,
  );
  if (since !== undefined) {
    items = items.filter((m) => m.cursor > since);
  } else {
    items = items.sort((a, b) => b.ts - a.ts).slice(0, limit);
  }
  items.sort((a, b) => a.ts - b.ts);
  const lastCursor = items.length ? items[items.length - 1].cursor : tenant._cursors[chat.id] || 0;
  res.json({ items, lastCursor });
});

app.post('/admin/chats/:id/interfere', authMiddleware, requireAdmin, (req, res) => {
  const tenant = getTenant(req, res);
  if (!tenant) return;
  const id = reqId(req);
  const chat = tenant.chats.find((c) => c.id === id);
  if (!chat) return res.status(404).json({ error: 'not_found' });
  if (chat.status === 'ended' || chat.status === 'resolved') {
    return res.status(409).json({ error: 'chat_final' });
  }
  if (chat.control.mode === 'operator' && chat.control.ownerUserId !== req.user.id) {
    return res.status(409).json({ error: 'already_controlled' });
  }
  chat.control = { mode: 'operator', ownerUserId: req.user.id, since: Date.now() };
  res.json(chat);
});

app.post('/admin/chats/:id/return', authMiddleware, requireAdmin, (req, res) => {
  const tenant = getTenant(req, res);
  if (!tenant) return;
  const id = reqId(req);
  const chat = tenant.chats.find((c) => c.id === id);
  if (!chat) return res.status(404).json({ error: 'not_found' });
  if (chat.control.mode === 'agent') return res.json(chat);
  if (chat.control.ownerUserId !== req.user.id) {
    return res.status(403).json({ error: 'not_owner' });
  }
  chat.control = { mode: 'agent', ownerUserId: null, since: Date.now() };
  res.json(chat);
});

registerBillingRoutes(app, { authMiddleware, requireAdmin, getTenant });
registerSimulatorRoutes(app, { authMiddleware, requireAdmin });

let serverInstance;
if (process.env.NODE_ENV !== 'test') {
  serverInstance = app.listen(MOCK_PORT, () => {
    console.log(`Mock backend listening on ${MOCK_PORT}`);
  });
  if (process.env.MOCK_ENABLE_SIMULATOR === 'true') {
    const { initWs } = await import('./ws/server.js');
    initWs(serverInstance, verifyToken);
  }
}

export default app;
