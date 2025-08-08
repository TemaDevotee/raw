const express = require('express');
const router = express.Router();
const { readDb, writeDb, ensureScopes } = require('../utils/db');

// Return account details
router.get('/', (req, res) => {
  const db = ensureScopes(readDb());
  res.json(db.account);
});

// Update a team member's role
router.patch('/team/:memberId', (req, res) => {
  const db = ensureScopes(readDb());
  const memberId = parseInt(req.params.memberId, 10);
  const { role } = req.body || {};
  const idx = db.account.team.findIndex((m) => m.id === memberId);
  if (idx === -1) return res.status(404).send();
  db.account.team[idx].role = role;
  writeDb(db);
  res.json(db.account.team[idx]);
});

// Invite a new team member
router.post('/team', (req, res) => {
  const db = ensureScopes(readDb());
  const { name, email, role } = req.body || {};
  const newMember = {
    id: Date.now(),
    name,
    email,
    role: role || 'Operator',
    status: 'invited',
  };
  db.account.team.push(newMember);
  writeDb(db);
  res.status(201).json(newMember);
});

// Remove a team member
router.delete('/team/:memberId', (req, res) => {
  const db = ensureScopes(readDb());
  const memberId = parseInt(req.params.memberId, 10);
  db.account.team = db.account.team.filter((m) => m.id !== memberId);
  writeDb(db);
  res.status(200).send();
});

// Delete entire account – resets the account and clears teams
router.delete('/', (req, res) => {
  const db = ensureScopes(readDb());
  db.account = { name: '', email: '', plan: '', team: [] };
  writeDb(db);
  res.status(200).send();
});

// Upgrade the account plan.  Accepts { plan } and persists it.
router.post('/upgrade', (req, res) => {
  const db = ensureScopes(readDb());
  const { plan } = req.body || {};
  db.account.plan = plan;
  writeDb(db);
  res.status(200).json({ plan });
});

module.exports = router;