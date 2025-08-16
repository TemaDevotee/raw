const express = require('express')
const fs = require('fs/promises')
const path = require('path')
const seed = require('../fixtures/demoTenants')

const router = express.Router()
const root = path.resolve(__dirname, '..', '..')
const dbPath = path.join(root, 'mock_backend', 'db.json')
const snapDir = path.join(root, '.mockdb')
const autosaveFile = path.join(snapDir, 'autosave.json')

async function ensureDir() { await fs.mkdir(snapDir, { recursive: true }) }

router.get('/snapshots', async (_req, res) => {
  await ensureDir()
  const files = await fs.readdir(snapDir).catch(() => [])
  const snaps = files.filter(f => f.endsWith('.json') && f !== 'autosave.json')
    .map(f => path.basename(f, '.json'))
  res.json(snaps)
})

router.post('/snapshot', async (req, res) => {
  const name = String(req.body?.name || '').trim()
  if (!name) return res.status(400).json({ error: 'name required' })
  await ensureDir()
  const data = await fs.readFile(dbPath, 'utf-8')
  await fs.writeFile(path.join(snapDir, `${name}.json`), data)
  res.json({ ok: true })
})

router.post('/load', async (req, res) => {
  const name = String(req.body?.name || '').trim()
  if (!name) return res.status(400).json({ error: 'name required' })
  try {
    const data = await fs.readFile(path.join(snapDir, `${name}.json`), 'utf-8')
    await fs.writeFile(dbPath, data)
    res.json({ ok: true })
  } catch {
    res.status(404).json({ error: 'not_found' })
  }
})

router.post('/reset', async (_req, res) => {
  const data = JSON.stringify(seed, null, 2)
  await fs.writeFile(dbPath, data)
  res.json({ ok: true })
})

router.get('/export', async (req, res) => {
  const name = String(req.query.name || '')
  try {
    await ensureDir()
    const file = path.join(snapDir, `${name}.json`)
    await fs.access(file)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${name}.json"`)
    res.sendFile(file)
  } catch {
    res.status(404).json({ error: 'not_found' })
  }
})

router.get('/autosave', async (_req, res) => {
  try {
    const raw = await fs.readFile(autosaveFile, 'utf-8')
    const json = JSON.parse(raw)
    res.json({ enabled: !!json.enabled })
  } catch {
    res.json({ enabled: false })
  }
})

router.post('/autosave', async (req, res) => {
  await ensureDir()
  const enabled = !!req.body?.enabled
  await fs.writeFile(autosaveFile, JSON.stringify({ enabled }))
  res.json({ ok: true })
})

module.exports = router
