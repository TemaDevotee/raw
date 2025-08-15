const express = require('express');
const fs = require('fs');
const path = require('path');
const { readDb, writeDb } = require('../utils/db');

const router = express.Router();
const root = path.resolve(__dirname, '..', '..');
const dbDir = path.join(root, '.mockdb');
const exportsDir = path.join(dbDir, 'exports');

function ensureDirs() {
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });
}

router.get('/snapshots', (_req, res) => {
  ensureDirs();
  const items = fs
    .readdirSync(exportsDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => {
      const stat = fs.statSync(path.join(exportsDir, e.name));
      return {
        name: e.name,
        created: stat.mtime.toISOString(),
        size: stat.size,
      };
    })
    .sort((a, b) => (a.created < b.created ? 1 : -1));
  res.json(items);
});

router.post('/save', (_req, res) => {
  ensureDirs();
  const db = readDb();
  const ts = new Date().toISOString().replace(/[:]/g, '-');
  const snapshotName = `${ts}.json`;
  const dest = path.join(exportsDir, snapshotName);
  fs.writeFileSync(path.join(dbDir, 'db.json'), JSON.stringify(db, null, 2));
  fs.writeFileSync(dest, JSON.stringify(db, null, 2));
  res.status(201).json({ ok: true, name: snapshotName });
});

router.post('/load', (req, res) => {
  const name = String(req.body?.name || '');
  if (!name) return res.status(400).json({ error: 'name required' });
  ensureDirs();
  const file = path.join(exportsDir, name);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'not_found' });
  const raw = fs.readFileSync(file, 'utf-8');
  const json = JSON.parse(raw);
  const backup = path.join(root, 'mock_backend', 'db.json.backup');
  const dbPath = path.join(root, 'mock_backend', 'db.json');
  if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, backup);
  writeDb(json);
  res.json({ ok: true });
});

router.delete('/snapshots/:name', (req, res) => {
  const name = req.params.name;
  ensureDirs();
  const file = path.join(exportsDir, name);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'not_found' });
  fs.unlinkSync(file);
  res.json({ ok: true });
});

router.get('/snapshots/:name', (req, res) => {
  const name = req.params.name;
  ensureDirs();
  const file = path.join(exportsDir, name);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'not_found' });
  res.setHeader('Content-Type', 'application/json');
  fs.createReadStream(file).pipe(res);
});

module.exports = router;
