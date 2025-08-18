import { PLANS, ensureReset, adjustTokens } from '../services/billing.js';
import { getQuery, getBody, toNumber } from '../utils/req.js';

export function registerBillingRoutes(app, { authMiddleware, requireAdmin, getTenant }) {
  app.get('/admin/billing/plan', authMiddleware, requireAdmin, (req, res) => {
    const tenant = getTenant(req, res);
    if (!tenant) return;
    ensureReset(tenant);
    res.json({ plan: tenant.billing.plan, tokenBalance: tenant.billing.tokenBalance, cycleResetAt: tenant.billing.cycleResetAt });
  });

  app.post('/admin/billing/plan', authMiddleware, requireAdmin, (req, res) => {
    const tenant = getTenant(req, res);
    if (!tenant) return;
    const body = getBody(req);
    const { planId } = body;
    if (!planId) return res.status(400).json({ message: 'planId required' });
    const plan = PLANS[planId];
    if (!plan) return res.status(422).json({ error: 'invalid_plan' });
    tenant.billing.plan = plan;
    tenant.plan = plan.name;
    res.json({ plan, tokenBalance: tenant.billing.tokenBalance, cycleResetAt: tenant.billing.cycleResetAt });
  });

  app.post('/admin/billing/adjust-tokens', authMiddleware, requireAdmin, (req, res) => {
    const tenant = getTenant(req, res);
    if (!tenant) return;
    const body = getBody(req);
    const { delta, reason } = body;
    if (delta === undefined) return res.status(400).json({ message: 'delta required' });
    const balance = adjustTokens(tenant, toNumber(delta, 0), reason);
    res.json({ tokenBalance: balance });
  });

  app.get('/admin/billing/usage/summary', authMiddleware, requireAdmin, (req, res) => {
    const tenant = getTenant(req, res);
    if (!tenant) return;
    const q = getQuery(req);
    const since = toNumber(q.since, 0);
    const until = toNumber(q.until, Date.now());
    const logs = (tenant.spendLogs || []).filter((l) => l.ts >= since && l.ts <= until);
    const totalTokens = logs.reduce((a, l) => a + l.tokens, 0);
    const byAgent = [];
    const byChat = [];
    const agentMap = new Map();
    const chatMap = new Map();
    for (const l of logs) {
      if (l.agentId) agentMap.set(l.agentId, (agentMap.get(l.agentId) || 0) + l.tokens);
      if (l.chatId) chatMap.set(l.chatId, (chatMap.get(l.chatId) || 0) + l.tokens);
    }
    agentMap.forEach((tokens, agentId) => byAgent.push({ agentId, tokens }));
    chatMap.forEach((tokens, chatId) => byChat.push({ chatId, tokens }));
    const day = 24 * 60 * 60 * 1000;
    const buckets = new Map();
    logs.forEach((l) => {
      const dayTs = Math.floor(l.ts / day) * day;
      buckets.set(dayTs, (buckets.get(dayTs) || 0) + l.tokens);
    });
    const series = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]).map(([ts, tokens]) => ({ ts, tokens }));
    res.json({ totalTokens, byAgent, byChat, series });
  });

  app.get('/admin/billing/usage/logs', authMiddleware, requireAdmin, (req, res) => {
    const tenant = getTenant(req, res);
    if (!tenant) return;
    const q = getQuery(req);
    const limit = toNumber(q.limit, 50);
    const cursor = q.cursor !== undefined ? toNumber(q.cursor) : null;
    let logs = [...(tenant.spendLogs || [])].sort((a, b) => b.ts - a.ts);
    if (cursor) logs = logs.filter((l) => l.ts < cursor);
    const items = logs.slice(0, limit);
    const nextCursor = items.length === limit ? items[items.length - 1].ts : null;
    res.json({ items, nextCursor });
  });
}
