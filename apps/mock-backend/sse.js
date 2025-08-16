const clients = new Map(); // tenantId -> Set(res)

export function sseHandler(req, res) {
  const tenantId = req.params.tenantId || 'global';
  let set = clients.get(tenantId);
  if (!set) {
    set = new Set();
    clients.set(tenantId, set);
  }
  if (set.size >= 5) {
    res.status(429).end();
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write('\n');
  set.add(res);
  const ping = setInterval(() => {
    try { res.write('event: ping\ndata: {}\n\n'); } catch {}
  }, 20000);
  req.on('close', () => {
    clearInterval(ping);
    set.delete(res);
  });
}

export function push(tenantId, event, data) {
  const set = clients.get(tenantId);
  if (!set) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try { res.write(payload); } catch {}
  }
}
