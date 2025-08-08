const express = require('express');
const router = express.Router();
const { readDb, writeDb, ensureScopes } = require('../utils/db');

// GET /api/workspaces
router.get('/', (req, res) => {
  const db = ensureScopes(readDb());
  res.json(db.workspaces);
});

// POST /api/workspaces – create a new workspace
router.post('/', (req, res) => {
  const db = ensureScopes(readDb());
  const name = (req.body && req.body.name) || `Workspace ${db.workspaces.length + 1}`;
  const id = 'ws-' + Date.now();
  const ws = {
    id,
    name,
    createdAt: Date.now(),
  };
  db.workspaces.push(ws);
  // Initialise scoped containers for the new workspace
  db.chatsByWs[ws.id] = [];
  db.teamsByWs[ws.id] = [];
  db.connectionsByWs[ws.id] = [];
  writeDb(db);
  res.status(201).json(ws);
});

// PATCH /api/workspaces/:id – rename a workspace
router.patch('/:id', (req, res) => {
  const db = ensureScopes(readDb());
  const id = req.params.id;
  const name = req.body && req.body.name;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const idx = db.workspaces.findIndex((w) => w.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Workspace not found' });
  }
  db.workspaces[idx].name = name.trim();
  writeDb(db);
  res.json(db.workspaces[idx]);
});

// DELETE /api/workspaces/:id – delete workspace if not default
router.delete('/:id', (req, res) => {
  const db = ensureScopes(readDb());
  const id = req.params.id;
  const idx = db.workspaces.findIndex((w) => w.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Workspace not found' });
  }
  if (db.workspaces[idx].isDefault) {
    return res.status(400).json({ error: 'Cannot delete default workspace' });
  }
  // Remove workspace and its scoped data
  db.workspaces.splice(idx, 1);
  delete db.chatsByWs[id];
  delete db.teamsByWs[id];
  delete db.connectionsByWs[id];
  writeDb(db);
  res.status(204).send();
});

module.exports = router;