
/*
 * NOTE: The chat control endpoints (interfere/return) are defined later in this file.
 * They are moved below the app initialisation to avoid using `app` before it's defined.
 */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Import modular route handlers.  Each file in the routes folder
// encapsulates a cohesive set of endpoints (account, workspaces,
// chats, teams, connections) and uses the shared database helpers
// defined in utils/db.js.  By splitting the API into separate
// modules the server becomes easier to reason about and maintain.
const accountRoutes = require('./routes/account');
const workspacesRoutes = require('./routes/workspaces');
const chatsRoutes = require('./routes/chats');
const teamsRoutes = require('./routes/teams');
const connectionsRoutes = require('./routes/connections');
const usageRoutes = require('./routes/usage');
const presenceRoutes = require('./routes/presence');
const draftsRoutes = require('./routes/drafts');
const knowledgeRoutes = require('./routes/knowledge');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = 3001;

app.use(bodyParser.json());

const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN || 'http://localhost:5175';
const checkAdminAuth = (req, res, next) => {
  const key = req.header('X-Admin-Key');
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
};

app.use(
  '/admin',
  cors({
    origin: ADMIN_ORIGIN,
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['X-Admin-Key', 'Content-Type']
  }),
  checkAdminAuth,
  adminRoutes
);

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174']
  })
);

// Mount modular routers.  The base path for each module corresponds
// to the resource it manages.  See the files in mock_backend/routes
// for the implementation details.
app.use('/api/account', accountRoutes);
app.use('/api/workspaces', workspacesRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api', presenceRoutes);
app.use('/api/drafts', draftsRoutes);
app.use('/api/knowledge', knowledgeRoutes);

// Keep the agents and knowledge routes in this file for now.  They
// operate on the top‑level collections in db.json.  If needed they
// can be modularised later.

// Read and write helpers for agents and other resources
const dbPath = path.join(__dirname, 'db.json');
const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const { ensureScopes } = require('./utils/db');
const writeDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));


// AUTH

app.post('/api/auth/login', (req, res) => {
  const { username, password, remember } = req.body || {};
  const db = ensureScopes(readDb());
  const u = (db.users || []).find(
    (x) => (x.username === username || x.email === username) && x.password === password
  );
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });
  const token = 'mocktoken-' + Date.now();
  const { password: _p, ...publicUser } = u; // do not expose password
  return res.json({ token, user: publicUser, remember: !!remember });
});

app.get('/api/auth/me', (req, res) => {
  const db = ensureScopes(readDb());
  const u =
    (db.users && db.users[0]) || { id: 1, name: 'App User', email: 'app@example.com' };
  const { password: _p, ...publicUser } = u;
  res.json({ user: publicUser });
});

// AGENTS
app.get('/api/agents', (req, res) => res.json(readDb().agents));
app.post('/api/agents', (req, res) => {
  const db = readDb();
  const newAgent = { id: Date.now(), isPublished: false, ...req.body };
  db.agents.push(newAgent);
  writeDb(db);
  res.status(201).json(newAgent);
});
app.get('/api/agents/:id', (req, res) => {
  const agent = readDb().agents.find((a) => a.id == req.params.id);
  if (agent) res.json(agent);
  else res.status(404).send();
});
app.patch('/api/agents/:id', (req, res) => {
  const db = readDb();
  const i = db.agents.findIndex((a) => a.id == req.params.id);
  if (i !== -1) {
    db.agents[i] = { ...db.agents[i], ...req.body };
    writeDb(db);
    res.json(db.agents[i]);
  } else res.status(404).send();
});
app.delete('/api/agents/:id', (req, res) => {
  const db = readDb();
  db.agents = db.agents.filter((a) => a.id != req.params.id);
  writeDb(db);
  res.status(200).send();
});

// KNOWLEDGE GROUPS
// KNOWLEDGE GROUPS
app.get('/api/knowledge_groups', (req, res) => {
  const db = readDb();
  const groupsWithCount = db.knowledgeGroups.map((g) => ({ ...g, fileCount: g.files.length }));
  res.json(groupsWithCount);
});
app.post('/api/knowledge_groups', (req, res) => {
  const db = readDb();
  const newGroup = { id: Date.now(), files: [], ...req.body };
  db.knowledgeGroups.push(newGroup);
  writeDb(db);
  res.status(201).json(newGroup);
});
app.delete('/api/knowledge_groups/:id', (req, res) => {
  const db = readDb();
  db.knowledgeGroups = db.knowledgeGroups.filter((g) => g.id != req.params.id);
  writeDb(db);
  res.status(200).send();
});
app.get('/api/knowledge_groups/:id', (req, res) => {
  const group = readDb().knowledgeGroups.find((g) => g.id == req.params.id);
  if (group) res.json(group);
  else res.status(404).send();
});
// Files in knowledge groups
app.post('/api/knowledge_groups/:id/files', (req, res) => {
  const db = readDb();
  const groupIndex = db.knowledgeGroups.findIndex((g) => g.id == req.params.id);
  if (groupIndex !== -1) {
    const newFile = { id: Date.now(), ...req.body };
    db.knowledgeGroups[groupIndex].files.push(newFile);
    writeDb(db);
    res.status(201).json(newFile);
  } else res.status(404).send();
});
app.delete('/api/knowledge_groups/:groupId/files/:fileId', (req, res) => {
  const db = readDb();
  const groupIndex = db.knowledgeGroups.findIndex((g) => g.id == req.params.groupId);
  if (groupIndex !== -1) {
    db.knowledgeGroups[groupIndex].files = db.knowledgeGroups[groupIndex].files.filter((f) => f.id != req.params.fileId);
    writeDb(db);
    res.status(200).send();
  } else res.status(404).send();
});
// MODELS
app.get('/api/llm_models', (req, res) => res.json(readDb().llm_models));

// Serve compiled static assets and ensure proper MIME for JS and map files in production
app.use(express.static(path.join(__dirname, '..', 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    if (filePath.endsWith('.map')) {
      res.setHeader('Content-Type', 'application/json');
    }
  },
}));

// Generic error handler to return consistent JSON responses
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const server = app.listen(PORT, () => {
  console.log(`Mock API server is running on http://localhost:${PORT}`);
});

module.exports = server;

// MEMBERSHIPS
app.get('/api/memberships', (req, res) => {
  const db = ensureScopes(readDb());
  const wsId = req.query.workspaceId;
  if (!wsId) return res.json([]);
  res.json(db.membershipsByWs[wsId] || []);
});
app.post('/api/memberships', (req, res) => {
  const db = ensureScopes(readDb());
  const wsId = req.query.workspaceId;
  const { userId, role } = req.body || {};
  if (!wsId || !userId || !role) return res.status(400).json({ error: 'Missing fields' });
  if (!db.membershipsByWs[wsId]) db.membershipsByWs[wsId] = [];
  const list = db.membershipsByWs[wsId];
  const existing = list.find(m => m.userId === userId);
  if (existing) existing.role = role; else list.push({ userId, role });
  writeDb(db);
  res.status(201).json({ userId, role });
});
app.patch('/api/memberships/:userId', (req, res) => {
  const db = ensureScopes(readDb());
  const wsId = req.query.workspaceId;
  const uid = parseInt(req.params.userId, 10);
  const { role } = req.body || {};
  const list = db.membershipsByWs[wsId] || [];
  const idx = list.findIndex(m => m.userId === uid);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  list[idx].role = role || list[idx].role;
  writeDb(db);
  res.json(list[idx]);
});

// PRESENCE
app.post('/api/presence/enter', (req, res) => {
  const db = ensureScopes(readDb());
  const { chatId, userId, name } = req.body || {};
  if (!db.presence[chatId]) db.presence[chatId] = [];
  const now = Date.now();
  const list = db.presence[chatId].filter(p => now - p.ts < 30000);
  const existing = list.find(p => p.userId === userId);
  if (existing) existing.ts = now; else list.push({ userId, name, ts: now });
  db.presence[chatId] = list;
  writeDb(db);
  res.json({ ok: true });
});
app.post('/api/presence/leave', (req, res) => {
  const db = ensureScopes(readDb());
  const { chatId, userId } = req.body || {};
  const list = (db.presence[chatId] || []).filter(p => p.userId !== userId);
  db.presence[chatId] = list;
  writeDb(db);
  res.json({ ok: true });
});
app.get('/api/presence', (req, res) => {
  const db = ensureScopes(readDb());
  const { chatId } = req.query;
  const now = Date.now();
  if (chatId) {
    const list = (db.presence[chatId] || []).filter(p => now - p.ts < 30000);
    return res.json(list);
  }
  const out = {};
  Object.keys(db.presence).forEach(cid => { out[cid] = (db.presence[cid] || []).filter(p => now - p.ts < 30000); });
  res.json(out);
});


// Chat-specific approve mode: when enabled, agent messages go to drafts until approved.
// ---------------------------------------------------------------------------
// Chat control endpoints
// These endpoints allow an operator to take control of a chat and later return
// control back to the agent.  They are placed here, after the Express app
// has been instantiated, to avoid a ReferenceError from using `app` before
// it is defined.
// Control: operator takes control (does NOT change chat status)
app.post('/api/chats/:id/interfere', (req, res) => {
  const db = ensureScopes(readDb());
  const chatId = String(req.params.id);
  // Initialise chat details and control if they don't exist
  if (!db.chatDetails) db.chatDetails = {};
  if (!db.chatDetails[chatId]) db.chatDetails[chatId] = { id: chatId, messages: [] };
  if (!db.chatControl) db.chatControl = {};
  if (!db.chatHeldBy) db.chatHeldBy = {};
  db.chatControl[chatId] = 'operator';
  db.chatHeldBy[chatId] = req.body?.operatorId || '1';
  // Log a system message when operator takes over
  db.chatDetails[chatId].messages.push({
    sender: 'system',
    text: 'Operator took control. Agent paused.',
    time: new Date().toLocaleTimeString(),
  });
  writeDb(db);
  res.json({ controlBy: 'operator', heldBy: db.chatHeldBy[chatId] });
});

// Control: return control to agent (does NOT change chat status)
app.post('/api/chats/:id/return', (req, res) => {
  const db = ensureScopes(readDb());
  const chatId = String(req.params.id);
  // Initialise chat details and control if they don't exist
  if (!db.chatDetails) db.chatDetails = {};
  if (!db.chatDetails[chatId]) db.chatDetails[chatId] = { id: chatId, messages: [] };
  if (!db.chatControl) db.chatControl = {};
  if (!db.chatHeldBy) db.chatHeldBy = {};
  db.chatControl[chatId] = 'agent';
  db.chatHeldBy[chatId] = null;
  // Log a system message when control is returned
  db.chatDetails[chatId].messages.push({
    sender: 'system',
    text: 'Operator returned control to the agent.',
    time: new Date().toLocaleTimeString(),
  });
  writeDb(db);
  res.json({ controlBy: 'agent', heldBy: null });
});

// ---------------------------------------------------------------------------
app.patch('/api/chats/:id/approve_mode', (req, res) => {
  const db = ensureScopes(readDb());
  const chatId = String(req.params.id);
  if (!db.chatApproveRequired) db.chatApproveRequired = {};
  db.chatApproveRequired[chatId] = !!(req.body && req.body.require);
  writeDb(db);
  res.json({ chatId, require: db.chatApproveRequired[chatId] });
});

// Agent message endpoint that respects approve mode.
app.post('/api/chats/:id/agent_message', (req, res) => {
  const db = ensureScopes(readDb());
  const chatId = String(req.params.id);
  const text = (req.body && req.body.text) || '';
  if (!db.chatDetails) db.chatDetails = {};
  if (!db.chatDetails[chatId]) db.chatDetails[chatId] = { id: chatId, messages: [] };
  // If operator has control OR approve mode set, send to drafts instead
  const operatorInControl = db.chatControl && db.chatControl[chatId] === 'operator';
  const needsApprove = db.chatApproveRequired && db.chatApproveRequired[chatId];
  if (operatorInControl || needsApprove) {
    if (!db.chatDrafts) db.chatDrafts = {};
    if (!db.chatDrafts[chatId]) db.chatDrafts[chatId] = [];
    const draft = { id: Date.now(), sender: 'agent', text };
    db.chatDrafts[chatId].push(draft);
    writeDb(db);
    return res.status(201).json({ queued: true, draft });
  }
  db.chatDetails[chatId].messages.push({ sender: 'agent', text, time: new Date().toLocaleTimeString() });
  writeDb(db);
  res.status(201).json({ queued: false });
});

// DRAFTS
app.get('/api/chats/:id/drafts', (req, res) => {
  const db = ensureScopes(readDb());
  const id = String(req.params.id);
  res.json(db.chatDrafts[id] || []);
});
app.post('/api/chats/:id/drafts', (req, res) => {
  const db = ensureScopes(readDb());
  const id = String(req.params.id);
  const draft = { id: Date.now(), sender: req.body?.sender || 'agent', text: req.body?.text || '' };
  if (!db.chatDrafts[id]) db.chatDrafts[id] = [];
  db.chatDrafts[id].push(draft);
  writeDb(db);
  res.status(201).json(draft);
});
app.post('/api/chats/:id/drafts/:draftId/approve', (req, res) => {
  const db = ensureScopes(readDb());
  const chatId = String(req.params.id);
  const draftId = parseInt(req.params.draftId, 10);
  const list = db.chatDrafts[chatId] || [];
  const idx = list.findIndex(d => d.id === draftId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const draft = list.splice(idx, 1)[0];
  db.chatDetails = db.chatDetails || {};
  if (!db.chatDetails[chatId]) db.chatDetails[chatId] = { id: chatId, messages: [] };
  db.chatDetails[chatId].messages.push({ sender: draft.sender, text: draft.text, time: new Date().toLocaleTimeString() });
  writeDb(db);
  res.json({ ok: true });
});
app.delete('/api/chats/:id/drafts/:draftId', (req, res) => {
  const db = ensureScopes(readDb());
  const chatId = String(req.params.id);
  const draftId = parseInt(req.params.draftId, 10);
  db.chatDrafts[chatId] = (db.chatDrafts[chatId] || []).filter(d => d.id !== draftId);
  writeDb(db);
  res.status(204).send();
});

app.patch('/api/agents/:id/approve_mode', (req, res) => {
  const db = readDb();
  const i = db.agents.findIndex((a) => a.id == req.params.id);
  if (i === -1) return res.status(404).send();
  db.agents[i].approveRequired = !!(req.body && req.body.approveRequired);
  writeDb(db);
  res.json(db.agents[i]);
});
