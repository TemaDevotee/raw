const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const dataPath = path.join(__dirname, '../fixtures/admin.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const plansById = Object.fromEntries(data.plans.map(p => [p.id, p]));
const dbPath = path.join(__dirname, '../db.json');
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

router.get('/plans', (req, res) => {
  res.json(data.plans);
});

router.get('/tenants', (req, res) => {
  const { q = '', plan, page = '1', limit = '20' } = req.query;
  const db = readDb();
  let items = (db.tenants || []).map(t => ({ id: t.id, name: t.name, billing: t.billing }));
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
  const counts = {
    workspacesCount: (t.workspaces || []).length,
    agentsCount: (t.agents || []).length,
    knowledgeCount: (t.knowledge || []).length,
    chatsCount: (t.chats || []).length,
  };
  res.json({ id: t.id, name: t.name, billing: t.billing, ...counts });
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
    sourceCount: c.sources.length
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
