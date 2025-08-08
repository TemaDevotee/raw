const express = require('express');
const router = express.Router();
const { readDb, writeDb, ensureScopes } = require('../utils/db');

// List connections for a workspace
router.get('/', (req, res) => {
  const db = ensureScopes(readDb());
  const wsId = req.query.workspaceId;
  if (!wsId) {
    return res.json([]);
  }
  const list = db.connectionsByWs[wsId] || [];
  res.json(list);
});

// Create a new connection.  Accepts { name, type, config }
router.post('/', (req, res) => {
  const db = ensureScopes(readDb());
  const wsId = req.query.workspaceId;
  if (!wsId || !db.connectionsByWs[wsId]) {
    return res.status(400).json({ error: 'Invalid workspaceId' });
  }
  const { name, type, config } = req.body || {};
  const connection = {
    id: Date.now(),
    name: name || `Connection ${db.connectionsByWs[wsId].length + 1}`,
    type: type || 'unknown',
    config: config || {},
  };
  db.connectionsByWs[wsId].push(connection);
  writeDb(db);
  res.status(201).json(connection);
});

// Delete a connection
router.delete('/:id', (req, res) => {
  const db = ensureScopes(readDb());
  const wsId = req.query.workspaceId;
  const id = parseInt(req.params.id, 10);
  if (!wsId || !db.connectionsByWs[wsId]) {
    return res.status(400).json({ error: 'Invalid workspaceId' });
  }
  const list = db.connectionsByWs[wsId];
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Connection not found' });
  }
  list.splice(idx, 1);
  writeDb(db);
  res.status(204).send();
});

module.exports = router;