import { WebSocketServer } from 'ws';

const tenants = new Map(); // tenantId -> Set<WebSocket>

export function initWs(server, verifyToken) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (socket, req) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      const payload = verifyToken(token || '');
      if (!payload) {
        socket.close();
        return;
      }
      const tenantId = payload.tenantId;
      socket._tenantId = tenantId;
      if (!tenants.has(tenantId)) tenants.set(tenantId, new Set());
      tenants.get(tenantId).add(socket);
      socket.on('close', () => {
        tenants.get(tenantId)?.delete(socket);
      });
    } catch {
      socket.close();
    }
  });
}

export function broadcast(tenantId, event) {
  const payload = JSON.stringify({ ...event, tenantId, ts: Date.now() });
  for (const socket of tenants.get(tenantId) || []) {
    try {
      socket.send(payload);
    } catch {
      // ignore
    }
  }
}
