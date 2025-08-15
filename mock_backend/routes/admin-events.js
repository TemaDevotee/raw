const express = require('express');
const { subscribe, unsubscribe } = require('../utils/eventBus');
const { requireRole } = require('../utils/adminAuth');

const router = express.Router();

router.get('/', requireRole(['owner','operator','viewer']), (req, res) => {
  if (process.env.ADMIN_SSE === '0') return res.status(503).end();
  const tenantId = req.user?.tenantId || req.query.tenant;
  if (!tenantId) return res.status(400).json({ error: 'tenant_required' });

  const token = (req.header('Authorization') || '').replace('Bearer ', '') || req.query.token;
  const key = req.header('X-Admin-Key') || req.query.key;
  if (!key || key !== (process.env.ADMIN_KEY || 'dev-admin-key')) return res.status(401).json({ error:'unauthorized' });
  const limit = Number(process.env.ADMIN_SSE_CONN_LIMIT || '3');
  const tokenCounts = adminEventTokenCounts;
  const count = tokenCounts.get(token) || 0;
  if (count >= limit) return res.status(429).json({ error: 'too_many_connections' });
  tokenCounts.set(token, count + 1);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const hbMs = Number(process.env.ADMIN_SSE_HEARTBEAT_MS || '20000');
  const hb = setInterval(() => {
    res.write(`event: heartbeat\n`);
    res.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
  }, hbMs);

  const fn = (event) => {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  subscribe(tenantId, fn);

  req.on('close', () => {
    clearInterval(hb);
    unsubscribe(tenantId, fn);
    tokenCounts.set(token, (tokenCounts.get(token) || 1) - 1);
  });
});

const adminEventTokenCounts = new Map();

module.exports = router;
