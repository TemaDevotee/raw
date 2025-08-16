import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { sseHandler, push } from './sse.js';

const app = express();
const port = process.env.PORT || 5174;
const ADMIN_KEY = process.env.VITE_ADMIN_KEY || 'dev-admin-key';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

function requireAdmin(req, res, next) {
  const key = req.get('X-Admin-Key');
  if (key && key === ADMIN_KEY) return next();
  return res.status(403).json({ error: 'Forbidden' });
}
  state.chats.push(chat);
  touch({ type: 'chat:create', chat });
  res.json(chat);
});

  res.json(message);
});

// Drafts
  res.json({ ok: true });
});

// Admin DB utilities
app.post('/admin/db/save', requireAdmin, (req, res) => {
  const name = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0] + '.json';
  const file = saveSnapshot(name);
  res.json({ saved: path.basename(file) });
});

app.post('/admin/db/load', requireAdmin, (req, res) => {
  loadSnapshot(req.body.name);
  res.json({ loaded: req.body.name });
});

app.post('/admin/db/reset', requireAdmin, (_req, res) => {
  resetState();
  res.json({ ok: true });
});

app.get('/admin/db/list', requireAdmin, (_req, res) => {
  res.json(listSnapshots());
});

app.post('/admin/db/autosave', requireAdmin, (req, res) => {
  const enabled = setAutosave(req.body.enabled);
  res.json({ enabled });
});

// Dummy admin endpoints
app.all('/admin/knowledge/*', requireAdmin, (_req, res) => res.json({ ok: true }));
app.all('/admin/billing/*', requireAdmin, (_req, res) => res.json({ ok: true }));
app.all('/admin/chats/*', requireAdmin, (_req, res) => res.json({ ok: true }));

app.listen(port, () => {
  console.log(`Mock backend listening on ${port}`);
});
