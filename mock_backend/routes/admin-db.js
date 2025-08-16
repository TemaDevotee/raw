const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const seed = require('../fixtures/demoTenants');

const router = express.Router();
const root = path.resolve(__dirname, '..', '..');
const dbPath = path.join(root, 'mock_backend', 'db.json');
const snapDir = path.join(root, '.mockdb');
const autosaveFile = path.join(snapDir, 'autosave.json');

async function ensureDir() {
  await fs.mkdir(snapDir, { recursive: true });
}

router.get('/snapshots', async (_req, res) => {
  await ensureDir();
  const files = await fs.readdir(snapDir).catch(() => []);
  const snapshots = files.filter(f => f.endsWith('.json') && f !== 'autosave.json').map(f => path.basename(f, '.json'));
  let autosave = false;
  try {
    const raw = await fs.readFile(autosaveFile, 'utf-8');
    autosave = !!JSON.parse(raw).enabled;
  } catch {}
  res.json({ snapshots, autosave });
});

router.post('/snapshot/save', async (_req, res) => {
  await ensureDir();
  const name = `snap-${Date.now()}`;
  const data = await fs.readFile(dbPath, 'utf-8');
  await fs.writeFile(path.join(snapDir, `${name}.json`), data);
  res.json({ name });
});

router.post('/snapshot/load', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(422).json({ error: 'name_required' });
  try {
    const data = await fs.readFile(path.join(snapDir, `${name}.json`), 'utf-8');
    await fs.writeFile(dbPath, data);
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'not_found' });
  }
});

router.post('/snapshot/reset', async (_req, res) => {
  const data = JSON.stringify(seed, null, 2);
  await fs.writeFile(dbPath, data);
  res.json({ ok: true });
});

router.get('/export', async (_req, res) => {
  await ensureDir();
  const name = `export-${Date.now()}.json`;
  const file = path.join(snapDir, name);
  try {
    await fs.copyFile(dbPath, file);
    res.download(file, name);
  } catch {
    res.status(500).json({ error: 'export_failed' });
  }
});

router.post('/autosave/toggle', async (req, res) => {
  await ensureDir();
  const enabled = !!req.body?.enabled;
  await fs.writeFile(autosaveFile, JSON.stringify({ enabled }));
  res.json({ enabled });
});

module.exports = router;
