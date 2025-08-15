const express = require('express')
const fs = require('fs')
const path = require('path')
const { nanoid } = require('nanoid')
const seed = require('../fixtures/demoTenants')

const dbPath = path.join(__dirname, '../db.json')
const writeDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))

const tokens = new Map()

const router = express.Router()

router.post('/dev/seed/reset', (_req, res) => {
  writeDb(JSON.parse(JSON.stringify(seed)))
  res.json({ ok: true })
})

router.post('/auth/impersonate', (req, res) => {
  if (process.env.DEV_IMPERSONATE !== '1') {
    return res.status(403).json({ error: 'disabled' })
  }
  const { tenantId } = req.body || {}
  if (!tenantId) return res.status(400).json({ error: 'tenant_required' })
  const token = nanoid()
  const exp = Date.now() + 5 * 60 * 1000
  tokens.set(token, { tenantId, exp })
  res.json({ token, expiresAt: new Date(exp).toISOString() })
})

module.exports = { router, tokens }
