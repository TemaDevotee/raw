import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { broadcast } from '../ws/server.js';
import { estimateTokens, ensureReset, chargeMessage } from '../services/billing.js';

export function registerSimulatorRoutes(app, { authMiddleware, requireAdmin }) {
  if (process.env.MOCK_ENABLE_SIMULATOR !== 'true') return;
  app.post('/admin/sim/events', authMiddleware, requireAdmin, (req, res) => {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    let applied = 0;
    for (const evt of events) {
      const ok = applyEvent(req, evt);
      if (ok) applied++;
    }
    res.json({ ok: true, applied });
  });
}

function applyEvent(req, evt) {
  const tenantId = evt.tenantId || req.tenantId;
  const tenant = db.tenants.find((t) => t.slug === tenantId);
  if (!tenant) return false;
  const chat = tenant.chats.find((c) => c.id === evt.payload?.chatId);
  switch (evt.type) {
    case 'presence.join': {
      if (!chat) return false;
      const uid = evt.payload.userId || req.user.id;
      if (!chat.presence.operators.includes(uid)) chat.presence.operators.push(uid);
      broadcast(tenantId, { type: 'presence.join', payload: { chatId: chat.id, userId: uid, role: 'operator' } });
      return true;
    }
    case 'presence.leave': {
      if (!chat) return false;
      const uid = evt.payload.userId || req.user.id;
      chat.presence.operators = chat.presence.operators.filter((o) => o !== uid);
      broadcast(tenantId, { type: 'presence.leave', payload: { chatId: chat.id, userId: uid, role: 'operator' } });
      return true;
    }
    case 'chat.status.update': {
      if (!chat) return false;
      chat.status = evt.payload.status;
      broadcast(tenantId, { type: 'chat.status.update', payload: { chatId: chat.id, status: chat.status } });
      return true;
    }
    case 'chat.control': {
      if (!chat) return false;
      if (evt.payload.control === 'operator') {
        chat.control = { mode: 'operator', ownerUserId: req.user.id, since: Date.now() };
      } else {
        chat.control = { mode: 'agent', ownerUserId: null, since: Date.now() };
      }
      broadcast(tenantId, { type: 'chat.control', payload: { chatId: chat.id, control: chat.control } });
      return true;
    }
    case 'chat.message':
    case 'chat.message.draft': {
      if (!chat) return false;
      const role = evt.type === 'chat.message.draft' ? 'agent' : evt.payload.from || 'agent';
      const text = evt.payload.content || '';
      const draft = evt.type === 'chat.message.draft';
      const tokens = estimateTokens(text);
      ensureReset(tenant);
      if (role === 'agent' && tenant.billing.tokenBalance < tokens && !evt.options?.simulateNoCharge) {
        return false;
      }
      const cursor = (tenant._cursors[chat.id] || 0) + 1;
      tenant._cursors[chat.id] = cursor;
      const now = Date.now();
      const msg = {
        id: nanoid(),
        chatId: chat.id,
        role,
        text,
        ts: now,
        cursor,
        draft: draft || undefined,
        approvedAt: null,
        discardedAt: null,
        deliveredAt: draft ? null : now,
      };
      tenant.messages.push(msg);
      chat.lastMessageAt = now;
      if (role === 'agent' && !evt.options?.simulateNoCharge) {
        tenant.billing.tokenBalance -= tokens;
        chargeMessage(tenant, { chatId: chat.id, agentId: chat.participants.agentId, messageId: msg.id, role, text, draft });
      }
      broadcast(tenantId, { type: evt.type, payload: msg });
      return true;
    }
    default:
      return false;
  }
}
