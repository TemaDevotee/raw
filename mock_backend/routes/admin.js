const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const dataPath = path.join(__dirname, '../fixtures/admin.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const plansById = Object.fromEntries(data.plans.map(p => [p.id, p]));
const dbPath = path.join(__dirname, '../db.json');
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const writeDb = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
const { snapshot } = require('./presence');

function computeUsed(billing) {
  const { period, ledger = [] } = billing;
  const start = new Date(period.start);
  const end = new Date(period.end);
  let used = 0;
  for (const e of ledger) {
    const ts = new Date(e.ts);
    if (ts >= start && ts <= end) {
      if (e.type === 'debit') used += e.amount || 0;
      if (e.type === 'credit') used -= e.amount || 0;
    }
  }
  return used < 0 ? 0 : used;
}

function updateTenant(id, fn) {
  const db = readDb();
  const idx = (db.tenants || []).findIndex(t => t.id === id);
  if (idx === -1) return null;
  fn(db.tenants[idx]);
  writeDb(db);
  return db.tenants[idx];
}

router.get('/plans', (req, res) => {
  res.json(data.plans);
});

router.get('/tenants', (req, res) => {
  const { q = '', plan, page = '1', limit = '20' } = req.query;
  const db = readDb();
  let items = (db.tenants || []).map(t => {
    const billing = { ...t.billing, tokenUsed: computeUsed(t.billing) };
    return { id: t.id, name: t.name, billing };
  });
  if (q) {
    const lq = q.toLowerCase();
    items = items.filter(t => t.name.toLowerCase().includes(lq) || t.billing.plan.toLowerCase().includes(lq));
  }
  if (plan) items = items.filter(t => t.billing.plan === plan);
  const p = parseInt(page, 10) || 1;
  const ps = parseInt(limit, 10) || 20;
  const total = items.length;
  const start = (p - 1) * ps;
  items = items.slice(start, start + ps);
  res.json({ items, page: p, limit: ps, total });
});

router.get('/tenants/:id', (req, res) => {
  const db = readDb();
  const t = (db.tenants || []).find(t => t.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'not_found' });
  t.billing.tokenUsed = computeUsed(t.billing);
  const counts = {
    workspacesCount: (t.workspaces || []).length,
    agentsCount: (t.agents || []).length,
    knowledgeCount: (t.knowledge || []).length,
    chatsCount: (t.chats || []).length,
  };
  res.json({ id: t.id, name: t.name, billing: t.billing, ...counts });
});

router.post('/tenants/:id/billing/plan', (req, res) => {
  const { plan } = req.body || {};
  if (!['Free', 'Pro', 'Team'].includes(plan)) return res.status(422).json({ error: 'invalid_plan' });
  const updated = updateTenant(req.params.id, t => {
    const from = t.billing.plan;
    t.billing.plan = plan;
    t.billing.ledger = t.billing.ledger || [];
    t.billing.ledger.push({ id: String(Date.now()), ts: new Date().toISOString(), type: 'plan-change', from, to: plan, by: req.header('X-Admin-Key') || 'dev' });
    t.billing.tokenUsed = computeUsed(t.billing);
  });
  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json({ billing: updated.billing });
});

router.post('/tenants/:id/billing/quota', (req, res) => {
  const { quota } = req.body || {};
  if (!Number.isInteger(quota) || quota < 0 || quota > 1_000_000_000) return res.status(422).json({ error: 'invalid_quota' });
  const updated = updateTenant(req.params.id, t => {
    const from = t.billing.tokenQuota;
    t.billing.tokenQuota = quota;
    t.billing.ledger = t.billing.ledger || [];
    t.billing.ledger.push({ id: String(Date.now()), ts: new Date().toISOString(), type: 'quota-change', from: String(from), to: String(quota), by: req.header('X-Admin-Key') || 'dev' });
    t.billing.tokenUsed = computeUsed(t.billing);
  });
  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json({ billing: updated.billing });
});

function handleCreditDebit(req, res, type) {
  const { amount, note } = req.body || {};
  if (!Number.isInteger(amount) || amount <= 0 || amount > 1_000_000_000) return res.status(422).json({ error: 'invalid_amount' });
  const updated = updateTenant(req.params.id, t => {
    t.billing.ledger = t.billing.ledger || [];
    t.billing.ledger.push({ id: String(Date.now()), ts: new Date().toISOString(), type, amount, by: req.header('X-Admin-Key') || 'dev', note });
    t.billing.tokenUsed = computeUsed(t.billing);
  });
  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json({ billing: updated.billing });
}

router.post('/tenants/:id/billing/credit', (req, res) => handleCreditDebit(req, res, 'credit'));
router.post('/tenants/:id/billing/debit', (req, res) => handleCreditDebit(req, res, 'debit'));

router.post('/tenants/:id/billing/reset-period', (req, res) => {
  const { start, end } = req.body || {};
  const updated = updateTenant(req.params.id, t => {
    const s = start || new Date().toISOString();
    const e = end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    t.billing.period = { start: s, end: e };
    t.billing.ledger = t.billing.ledger || [];
    t.billing.ledger.push({ id: String(Date.now()), ts: new Date().toISOString(), type: 'period-reset', by: req.header('X-Admin-Key') || 'dev' });
    t.billing.tokenUsed = computeUsed(t.billing);
  });
  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json({ billing: updated.billing });
});

router.get('/tenants/:id/billing/ledger', (req, res) => {
  const { limit = '50', cursor = '0' } = req.query;
  const db = readDb();
  const t = (db.tenants || []).find(t => t.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'not_found' });
  const list = (t.billing.ledger || []).slice().sort((a, b) => new Date(b.ts) - new Date(a.ts));
  const l = parseInt(limit, 10) || 50;
  const c = parseInt(cursor, 10) || 0;
  const items = list.slice(c, c + l);
  const nextCursor = c + l < list.length ? c + l : null;
  res.json({ items, nextCursor });
});

router.get('/users', (req, res) => {
  const { q = '', plan, page = '1', pageSize = '20', sort = 'name', dir = 'asc' } = req.query;
  let items = data.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    plan: u.plan,
    planName: plansById[u.plan]?.name || u.plan,
    tokens: u.billing.tokens,
    tokenUsagePct: u.billing.tokens.total ? u.billing.tokens.used / u.billing.tokens.total : 0
  }));

  if (q) {
    const lq = q.toLowerCase();
    items = items.filter(u =>
      u.name.toLowerCase().includes(lq) ||
      u.email.toLowerCase().includes(lq) ||
      u.id.toLowerCase().includes(lq)
    );
  }
  if (plan) items = items.filter(u => u.plan === plan);

  const dirFactor = dir === 'desc' ? -1 : 1;
  items.sort((a, b) => {
    if (sort === 'plan') return (a.plan > b.plan ? 1 : -1) * dirFactor;
    if (sort === 'tokensUsed') return (a.tokens.used - b.tokens.used) * dirFactor;
    return a.name.localeCompare(b.name) * dirFactor;
  });

  const p = parseInt(page, 10) || 1;
  const ps = parseInt(pageSize, 10) || 20;
  const total = items.length;
  const start = (p - 1) * ps;
  const paged = items.slice(start, start + ps);
  res.json({ items: paged, total, page: p, pageSize: ps });
});

router.get('/users/:id', (req, res) => {
  const u = data.users.find(u => u.id === req.params.id);
  if (!u) return res.status(404).send();
  const { workspaces, agents, knowledge, chats, ...rest } = u;
  res.json({ ...rest, planName: plansById[u.plan]?.name || u.plan });
});

router.get('/users/:id/workspaces', (req, res) => {
  const u = data.users.find(u => u.id === req.params.id);
  if (!u) return res.status(404).send();
  const ws = u.workspaces.map(w => ({
    id: w.id,
    name: w.name,
    agentsCount: u.agents.filter(a => a.workspaceId === w.id).length,
    chatsCount: u.chats.filter(c => c.workspaceId === w.id).length,
    collectionsCount: u.knowledge.filter(k => k.workspaceId === w.id).length
  }));
  res.json(ws);
});

router.get('/users/:id/agents', (req, res) => {
  const u = data.users.find(u => u.id === req.params.id);
  if (!u) return res.status(404).send();
  res.json(u.agents);
});

router.get('/users/:id/knowledge', (req, res) => {
  const u = data.users.find(u => u.id === req.params.id);
  if (!u) return res.status(404).send();
  const k = u.knowledge.map(c => ({
    id: c.id,
    name: c.name,
    workspaceId: c.workspaceId,
    sourcesCount: c.sources.length
  }));
  res.json(k);
});

router.get('/users/:id/chats', (req, res) => {
  const u = data.users.find(u => u.id === req.params.id);
  if (!u) return res.status(404).send();
  const ch = u.chats.map(c => ({ id: c.id, title: c.title, status: c.status, updatedAt: c.updatedAt }));
  res.json(ch);
});

// --- Chat console endpoints ---

router.get('/chats', (req, res) => {
  const { tenantId, page = '1', q = '', limit = '20' } = req.query;
  const db = readDb();
  let items = [];
  for (const t of db.tenants || []) {
    if (tenantId && t.id !== tenantId) continue;
    for (const c of t.chats || []) {
      items.push({ ...c, tenantId: t.id });
    }
  }
  if (q) {
    const lq = String(q).toLowerCase();
    items = items.filter(c => (c.subject || '').toLowerCase().includes(lq));
  }
  const p = parseInt(page, 10) || 1;
  const ps = parseInt(limit, 10) || 20;
  const total = items.length;
  const start = (p - 1) * ps;
  const paged = items.slice(start, start + ps);
  res.json({ items: paged, total, page: p, pageSize: ps });
});

router.get('/chats/:chatId/transcript', (req, res) => {
  const { since = '0' } = req.query;
  const db = readDb();
  const chatId = String(req.params.chatId);
  const s = parseInt(since, 10) || 0;
  const messages = (db.chatDetails?.[chatId]?.messages || []).filter(m => (m.ts || 0) > s);
  const norm = messages.map(m => ({
    id: m.id,
    role: m.role,
    text: m.text,
    ts: m.ts,
  }));
  res.json(norm);
});

router.get('/chats/:chatId/drafts', (req, res) => {
  const { since = '0' } = req.query;
  const db = readDb();
  const chatId = String(req.params.chatId);
  const s = parseInt(since, 10) || 0;
  const drafts = (db.draftsByChat?.[chatId] || []).filter(d => d.state !== 'discarded' && (Date.parse(d.createdAt) || 0) > s);
  res.json(drafts);
});

router.post('/chats', (req, res) => {
  const { tenantId, workspaceId, subject = '', participants = [] } = req.body || {};
  if (!tenantId || !workspaceId) return res.status(422).json({ error: 'invalid_payload' });
  const db = readDb();
  const tenant = (db.tenants || []).find(t => t.id === tenantId);
  if (!tenant) return res.status(404).json({ error: 'not_found' });
  tenant.chats = tenant.chats || [];
  const id = `c${Date.now()}`;
  const chat = {
    id,
    workspaceId,
    subject,
    participants,
    status: 'open',
    updatedAt: new Date().toISOString(),
  };
  tenant.chats.push(chat);
  writeDb(db);
  res.json({ chatId: id });
});

router.post('/chats/:chatId/messages', (req, res) => {
  const { from, text = '', meta } = req.body || {};
  if (!from || !['user', 'agent', 'operator'].includes(from)) return res.status(422).json({ error: 'invalid_from' });
  const db = readDb();
  const chatId = String(req.params.chatId);
  db.chatDetails = db.chatDetails || {};
  if (!db.chatDetails[chatId]) db.chatDetails[chatId] = { id: chatId, messages: [] };
  const now = Date.now();
  const msg = { id: `m${now}`, from, text, meta, ts: now };
  db.chatDetails[chatId].messages.push(msg);
  // touch chat updatedAt
  for (const t of db.tenants || []) {
    const chat = (t.chats || []).find(c => c.id === chatId);
    if (chat) chat.updatedAt = new Date(now).toISOString();
  }
  writeDb(db);
  res.json({ id: msg.id, createdAt: new Date(now).toISOString() });
});

router.post('/chats/:chatId/drafts', (req, res) => {
  const { text = '' } = req.body || {};
  const db = readDb();
  const chatId = String(req.params.chatId);
  db.draftsByChat = db.draftsByChat || {};
  db.draftsByChat[chatId] = db.draftsByChat[chatId] || [];
  const now = Date.now();
  const draft = { id: `d${now}`, text, createdAt: new Date(now).toISOString(), state: 'queued' };
  db.draftsByChat[chatId].push(draft);
  writeDb(db);
  res.json({ id: draft.id, createdAt: draft.createdAt });
});

router.post('/chats/:chatId/drafts/:draftId/approve', (req, res) => {
  const db = readDb();
  const { chatId, draftId } = req.params;
  const drafts = db.draftsByChat?.[chatId] || [];
  const idx = drafts.findIndex(d => d.id === draftId);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  const draft = drafts[idx];
  draft.state = 'approved';
  const now = Date.now();
  db.chatDetails = db.chatDetails || {};
  if (!db.chatDetails[chatId]) db.chatDetails[chatId] = { id: chatId, messages: [] };
  const msg = { id: `m${now}`, from: 'agent', text: draft.text, ts: now };
  db.chatDetails[chatId].messages.push(msg);
  drafts.splice(idx, 1);
  for (const t of db.tenants || []) {
    const chat = (t.chats || []).find(c => c.id === chatId);
    if (chat) chat.updatedAt = new Date(now).toISOString();
  }
  writeDb(db);
  res.json({ message: { id: msg.id, role: 'agent', text: msg.text, createdAt: new Date(now).toISOString() } });
});

router.post('/chats/:chatId/drafts/:draftId/discard', (req, res) => {
  const db = readDb();
  const { chatId, draftId } = req.params;
  const drafts = db.draftsByChat?.[chatId] || [];
  const idx = drafts.findIndex(d => d.id === draftId);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  drafts[idx].state = 'discarded';
  writeDb(db);
  res.json({ removed: true });
});

router.get('/chats/:chatId/presence', (req, res) => {
  res.json(snapshot(String(req.params.chatId)));
});

const STORAGE_DIR = path.join(__dirname, '..', '..', 'mock_storage');
fs.mkdirSync(STORAGE_DIR, { recursive: true });

function calcUsage(db, tenantId) {
  return db.knowledgeSources
    .filter(s => s.tenantId === tenantId)
    .reduce((sum, s) => sum + (s.size || 0), 0);
}

router.get('/knowledge', (req, res) => {
  const { tenantId } = req.query;
  const db = readDb();
  const collections = (db.knowledgeCollections || [])
    .filter(c => c.tenantId === tenantId)
    .map(c => {
      const files = (db.knowledgeSources || []).filter(s => s.collectionId === c.id);
      const bytes = files.reduce((sum, f) => sum + (f.size || 0), 0);
      return { id: c.id, name: c.name, filesCount: files.length, bytes };
    });
  const used = collections.reduce((sum, c) => sum + c.bytes, 0);
  const tenant = (db.tenants || []).find(t => t.id === tenantId);
  const quota = tenant?.billing?.storageQuotaMB || 0;
  res.json({ collections, storageUsedMB: used / (1024 * 1024), storageQuotaMB: quota });
});

router.post('/knowledge/collections', (req, res) => {
  const { tenantId, name } = req.body || {};
  if (!tenantId || !name) return res.status(422).json({ error: 'invalid' });
  const db = readDb();
  const coll = { id: String(Date.now()), tenantId, name, createdAt: new Date().toISOString() };
  db.knowledgeCollections = db.knowledgeCollections || [];
  db.knowledgeCollections.push(coll);
  writeDb(db);
  res.status(201).json(coll);
});

router.delete('/knowledge/collections/:id', (req, res) => {
  const id = req.params.id;
  const db = readDb();
  const coll = (db.knowledgeCollections || []).find(c => c.id === id);
  if (!coll) return res.status(404).json({ error: 'not_found' });
  db.knowledgeCollections = db.knowledgeCollections.filter(c => c.id !== id);
  const files = (db.knowledgeSources || []).filter(s => s.collectionId === id);
  db.knowledgeSources = (db.knowledgeSources || []).filter(s => s.collectionId !== id);
  files.forEach(f => {
    try {
      fs.rmSync(path.join(STORAGE_DIR, f.path), { force: true });
    } catch {}
  });
  const tenant = (db.tenants || []).find(t => t.id === coll.tenantId);
  if (tenant && tenant.billing) {
    tenant.billing.storageUsedMB = calcUsage(db, coll.tenantId) / (1024 * 1024);
  }
  writeDb(db);
  res.json({ removed: true });
});

router.get('/knowledge/collections/:id/files', (req, res) => {
  const id = req.params.id;
  const db = readDb();
  const files = (db.knowledgeSources || [])
    .filter(s => s.collectionId === id)
    .map(f => ({
      id: f.id,
      name: f.name,
      sizeBytes: f.size,
      contentType: f.mime,
      createdAt: f.createdAt
    }));
  res.json(files);
});

router.post('/knowledge/collections/:id/files', (req, res) => {
  const collectionId = req.params.id;
  const ct = req.headers['content-type'] || '';
  const m = ct.match(/boundary=(.+)$/);
  if (!m) return res.status(400).json({ error: 'no_boundary' });
  const boundary = '--' + m[1];
  const chunks = [];
  let size = 0;
  req.on('data', chunk => {
    size += chunk.length;
    if (size > 20 * 1024 * 1024) {
      req.destroy();
      return res.status(413).json({ error: 'FILE_TOO_LARGE' });
    }
    chunks.push(chunk);
  });
  req.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const parts = buffer
      .toString('binary')
      .split(boundary)
      .filter(p => p.trim());
    let filePart = null;
    let filename = '';
    let mime = 'application/octet-stream';
    for (const part of parts) {
      const [head, body] = part.split('\r\n\r\n');
      if (!head || !body) continue;
      const nameMatch = /name="([^"]+)"/.exec(head);
      const filenameMatch = /filename="([^"]+)"/.exec(head);
      if (nameMatch && filenameMatch) {
        filename = filenameMatch[1];
        const mimeMatch = /Content-Type: ([^\r\n]+)/.exec(head);
        if (mimeMatch) mime = mimeMatch[1];
        const content = body.slice(0, -2);
        filePart = Buffer.from(content, 'binary');
      }
    }
    if (!filePart) return res.status(422).json({ error: 'NO_FILE' });
    const allowed = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'image/png',
      'image/jpeg'
    ];
    if (!allowed.includes(mime)) return res.status(415).json({ error: 'UNSUPPORTED_TYPE' });
    const db = readDb();
    const coll = (db.knowledgeCollections || []).find(c => c.id === collectionId);
    if (!coll) return res.status(404).json({ error: 'not_found' });
    const used = calcUsage(db, coll.tenantId);
    const quota = (db.tenants.find(t => t.id === coll.tenantId)?.billing?.storageQuotaMB || 0) * 1024 * 1024;
    if (used + filePart.length > quota) {
      return res.status(409).json({ code: 'QUOTA_EXCEEDED' });
    }
    const fileId = String(Date.now());
    const rel = path.join(coll.tenantId, collectionId, `${fileId}_${filename}`);
    const full = path.join(STORAGE_DIR, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, filePart);
    db.knowledgeSources = db.knowledgeSources || [];
    db.knowledgeSources.push({
      id: fileId,
      tenantId: coll.tenantId,
      collectionId,
      name: filename,
      size: filePart.length,
      mime,
      path: rel,
      createdAt: new Date().toISOString()
    });
    const tenant = db.tenants.find(t => t.id === coll.tenantId);
    if (tenant && tenant.billing) {
      tenant.billing.storageUsedMB = calcUsage(db, coll.tenantId) / (1024 * 1024);
    }
    writeDb(db);
    res.status(201).json({ id: fileId, name: filename, sizeBytes: filePart.length, contentType: mime, createdAt: new Date().toISOString() });
  });
});

router.get('/knowledge/files/:id', (req, res) => {
  const id = req.params.id;
  const db = readDb();
  const f = (db.knowledgeSources || []).find(s => s.id === id);
  if (!f) return res.status(404).json({ error: 'not_found' });
  res.type(f.mime);
  fs.createReadStream(path.join(STORAGE_DIR, f.path)).pipe(res);
});

router.delete('/knowledge/files/:id', (req, res) => {
  const id = req.params.id;
  const db = readDb();
  const f = (db.knowledgeSources || []).find(s => s.id === id);
  if (!f) return res.status(404).json({ error: 'not_found' });
  db.knowledgeSources = db.knowledgeSources.filter(s => s.id !== id);
  try {
    fs.rmSync(path.join(STORAGE_DIR, f.path), { force: true });
  } catch {}
  const tenant = db.tenants.find(t => t.id === f.tenantId);
  if (tenant && tenant.billing) {
    tenant.billing.storageUsedMB = calcUsage(db, f.tenantId) / (1024 * 1024);
  }
  writeDb(db);
  res.json({ removed: true });
});

module.exports = router;
