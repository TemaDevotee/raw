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

module.exports = router;
