const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const dataPath = path.join(__dirname, '../adminData.json');
const readData = () => JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

router.get('/users', (req, res) => {
  res.json(readData().users);
});

router.get('/users/:id', (req, res) => {
  const data = readData();
  const user = data.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).send();
  res.json(user);
});

router.get('/users/:id/workspaces', (req, res) => {
  const data = readData();
  res.json(data.workspaces[req.params.id] || []);
});

router.get('/users/:id/agents', (req, res) => {
  const data = readData();
  res.json(data.agents[req.params.id] || []);
});

router.get('/users/:id/chats', (req, res) => {
  const data = readData();
  res.json(data.chats[req.params.id] || []);
});

router.get('/users/:id/knowledge', (req, res) => {
  const data = readData();
  res.json(data.knowledge[req.params.id] || []);
});

module.exports = router;
