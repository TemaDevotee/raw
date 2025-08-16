const express = require('express');
const { subscribe, unsubscribe } = require('../utils/eventBus');

const router = express.Router();
const counts = new Map();

router.get('/:tenantId', (req, res) => {
  const tenantId = req.params.tenantId;
  const key = req.header('X-Admin-Key') || req.query.admin_key;
  if (!key || key !== (process.env.ADMIN_KEY || 'dev-admin-key')) return res.status(401).end();
  const current = counts.get(tenantId) || 0;
  if (current >= 2) return res.status(429).end();
  counts.set(tenantId, current + 1);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  const lastId = Number(req.header('Last-Event-ID') || req.query.lastEventId || 0);
  const send = evt => {
    res.write(`id: ${evt.id}\n`);
    res.write(`event: ${evt.type}\n`);
    res.write(`data: ${JSON.stringify(evt)}\n\n`);
  };
  subscribe(tenantId, send, lastId);
  const hb = setInterval(() => {
    res.write('event: ping\ndata: {}\n\n');
  }, 15000);
  req.on('close', () => {
    clearInterval(hb);
    unsubscribe(tenantId, send);
    counts.set(tenantId, (counts.get(tenantId) || 1) - 1);
  });
});

module.exports = router;
