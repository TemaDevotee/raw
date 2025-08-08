const express = require('express');
const router = express.Router();
const { readDb, writeDb, ensureScopes } = require('../utils/db');

// Return list of teams for a workspace.  Teams are scoped by
// workspaceId.  If no workspaceId is supplied an empty array is
// returned.  The Team shape is intentionally simple: id and name.
router.get('/', (req, res) => {
  const db = ensureScopes(readDb());
  const wsId = req.query.workspaceId;
  if (!wsId) {
    return res.json([]);
  }
  const list = db.teamsByWs[wsId] || [];
  res.json(list);
});

// Create a new team within the specified workspace.  Expects { name }
router.post('/', (req, res) => {
  const db = ensureScopes(readDb());
  const wsId = req.query.workspaceId;
  if (!wsId || !db.teamsByWs[wsId]) {
    return res.status(400).json({ error: 'Invalid workspaceId' });
  }
  const name = (req.body && req.body.name) || `Team ${db.teamsByWs[wsId].length + 1}`;
  const team = {
    id: Date.now(),
    name: name.trim(),
  };
  db.teamsByWs[wsId].push(team);
  writeDb(db);
  res.status(201).json(team);
});

// Rename a team by id.  Searches across all workspaces.
router.patch('/:id', (req, res) => {
  const db = ensureScopes(readDb());
  const id = parseInt(req.params.id, 10);
  const name = req.body && req.body.name;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  let updated;
  for (const wsId of Object.keys(db.teamsByWs)) {
    const list = db.teamsByWs[wsId];
    const idx = list.findIndex((t) => t.id === id);
    if (idx !== -1) {
      list[idx].name = name.trim();
      updated = list[idx];
      break;
    }
  }
  if (!updated) {
    return res.status(404).json({ error: 'Team not found' });
  }
  writeDb(db);
  res.json(updated);
});

// Delete a team by id
router.delete('/:id', (req, res) => {
  const db = ensureScopes(readDb());
  const id = parseInt(req.params.id, 10);
  let removed = false;
  for (const wsId of Object.keys(db.teamsByWs)) {
    const list = db.teamsByWs[wsId];
    const idx = list.findIndex((t) => t.id === id);
    if (idx !== -1) {
      list.splice(idx, 1);
      removed = true;
      break;
    }
  }
  if (!removed) {
    return res.status(404).json({ error: 'Team not found' });
  }
  writeDb(db);
  res.status(204).send();
});

module.exports = router;