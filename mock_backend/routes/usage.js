const express = require('express');
const router = express.Router();
const { readDb, writeDb, ensureScopes } = require('../utils/db');

router.post('/record', (req, res) => {
  const db = ensureScopes(readDb());
  const rec = {
    id: 'u_' + Date.now(),
    ts: new Date().toISOString(),
    ...req.body,
  };
  rec.totalTokens = (rec.inputTokens || 0) + (rec.outputTokens || 0);
  db.usage = db.usage || [];
  db.usage.push(rec);
  db.account.usedThisPeriod += rec.totalTokens;
  const included = db.account.includedMonthlyTokens;
  if (db.account.usedThisPeriod > included) {
    const excess = db.account.usedThisPeriod - included;
    db.account.topupBalance = Math.max(0, db.account.topupBalance - excess);
  }
  const remainingInPeriod = Math.max(0, included - db.account.usedThisPeriod);
  const totalRemaining = remainingInPeriod + db.account.topupBalance;
  writeDb(db);
  res.json({
    plan: db.account.plan,
    periodStart: db.account.periodStart,
    periodEnd: db.account.periodEnd,
    includedMonthlyTokens: included,
    usedThisPeriod: db.account.usedThisPeriod,
    topupBalance: db.account.topupBalance,
    remainingInPeriod,
    totalRemaining,
  });
});

router.get('/aggregate', (req, res) => {
  const db = ensureScopes(readDb());
  const { groupBy } = req.query;
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  const map = {};
  for (const u of db.usage || []) {
    const ts = new Date(u.ts);
    if (from && ts < from) continue;
    if (to && ts > to) continue;
    const key = groupBy === 'agent' ? u.agentId : u.chatId;
    if (!map[key]) map[key] = { key, totalTokens: 0, messages: 0 };
    map[key].totalTokens += u.totalTokens;
    map[key].messages += 1;
  }
  res.json(Object.values(map));
});

module.exports = router;
