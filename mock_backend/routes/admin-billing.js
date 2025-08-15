const express = require('express')
const { readDb, writeDb, ensureScopes } = require('../utils/db')
const { withIdempotency } = require('../utils/adminAuth')

const router = express.Router()

function findTenant(db, id) {
  return (db.tenants || []).find(t => t.id === id)
}

router.get('/', (req, res) => {
  const { tenantId } = req.query
  const db = ensureScopes(readDb())
  const t = findTenant(db, tenantId)
  if (!t) return res.status(404).json({ error: 'not_found' })
  const billing = t.billing || {}
  const usageBreakdown = {
    tokens: { used: billing.tokenUsed || 0, quota: billing.tokenQuota || 0 },
    storageMB: { used: billing.storageUsedMB || 0, quota: billing.storageQuotaMB || 0 }
  }
  res.json({ billing, usageBreakdown })
})

router.get('/ledger', (req, res) => {
  const { tenantId, cursor = '0', limit = '50' } = req.query
  const db = ensureScopes(readDb())
  const t = findTenant(db, tenantId)
  if (!t) return res.status(404).json({ error: 'not_found' })
  const list = (t.billing.ledger || []).slice().sort((a, b) => new Date(b.time) - new Date(a.time))
  const c = parseInt(cursor, 10) || 0
  const l = parseInt(limit, 10) || 50
  const items = list.slice(c, c + l)
  const nextCursor = c + l < list.length ? c + l : null
  res.json({ items, nextCursor })
})

router.post('/tokens/credit', withIdempotency((req, res) => {
  const { tenantId, amount, reason } = req.body || {}
  if (!tenantId || !Number.isInteger(amount) || amount <= 0) return res.status(422).json({ error: 'invalid' })
  const db = ensureScopes(readDb())
  const t = findTenant(db, tenantId)
  if (!t) return res.status(404).json({ error: 'not_found' })
  const b = t.billing
  b.tokenUsed = Math.max(0, (b.tokenUsed || 0) - amount)
  const entry = {
    id: Date.now().toString(),
    time: new Date().toISOString(),
    type: 'credit',
    delta: amount,
    balance: (b.tokenQuota || 0) - (b.tokenUsed || 0),
    reason,
    idemKey: req.header('Idempotency-Key') || undefined
  }
  b.ledger = [entry, ...(b.ledger || [])]
  writeDb(db)
  res.status(201).json({ billing: b })
}))

router.post('/tokens/debit', withIdempotency((req, res) => {
  const { tenantId, amount, reason } = req.body || {}
  if (!tenantId || !Number.isInteger(amount) || amount <= 0) return res.status(422).json({ error: 'invalid' })
  const db = ensureScopes(readDb())
  const t = findTenant(db, tenantId)
  if (!t) return res.status(404).json({ error: 'not_found' })
  const b = t.billing
  if ((b.tokenUsed || 0) + amount > (b.tokenQuota || 0)) {
    return res.status(409).json({ error: 'over_quota' })
  }
  b.tokenUsed = (b.tokenUsed || 0) + amount
  const entry = {
    id: Date.now().toString(),
    time: new Date().toISOString(),
    type: 'debit',
    delta: -amount,
    balance: (b.tokenQuota || 0) - (b.tokenUsed || 0),
    reason,
    idemKey: req.header('Idempotency-Key') || undefined
  }
  b.ledger = [entry, ...(b.ledger || [])]
  writeDb(db)
  res.status(201).json({ billing: b })
}))

router.post('/period/reset', withIdempotency((req, res) => {
  const { tenantId, reason } = req.body || {}
  if (!tenantId) return res.status(422).json({ error: 'invalid' })
  const db = ensureScopes(readDb())
  const t = findTenant(db, tenantId)
  if (!t) return res.status(404).json({ error: 'not_found' })
  const b = t.billing
  b.tokenUsed = 0
  b.period = { start: new Date().toISOString(), end: new Date(Date.now() + 30*24*60*60*1000).toISOString() }
  const entry = {
    id: Date.now().toString(),
    time: new Date().toISOString(),
    type: 'reset',
    delta: 0,
    balance: (b.tokenQuota || 0),
    reason,
    idemKey: req.header('Idempotency-Key') || undefined
  }
  b.ledger = [entry, ...(b.ledger || [])]
  writeDb(db)
  res.status(201).json({ billing: b })
}))

module.exports = router
