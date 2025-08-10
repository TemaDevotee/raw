const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { readDb, writeDb, ensureScopes } = require('../utils/db')

const STORAGE_DIR = path.join(__dirname, '..', 'storage')
fs.mkdirSync(STORAGE_DIR, { recursive: true })

function getUsedStorage(db, tenantId) {
  return db.knowledgeSources
    .filter((s) => s.tenantId === tenantId)
    .reduce((sum, s) => sum + (s.size || 0), 0)
}

// Collections
router.get('/collections', (req, res) => {
  const { tenantId } = req.query
  const db = ensureScopes(readDb())
  const items = db.knowledgeCollections.filter((c) => !tenantId || c.tenantId === tenantId)
  res.json(items)
})

router.post('/collections', (req, res) => {
  const { tenantId, name = '' } = req.body || {}
  if (!tenantId || !name) return res.status(422).json({ error: 'invalid' })
  const db = ensureScopes(readDb())
  const coll = {
    id: Date.now().toString(),
    tenantId,
    name,
    createdAt: new Date().toISOString(),
    sourcesCount: 0,
  }
  db.knowledgeCollections.push(coll)
  writeDb(db)
  res.status(201).json(coll)
})

router.delete('/collections/:id', (req, res) => {
  const id = req.params.id
  const db = ensureScopes(readDb())
  db.knowledgeCollections = db.knowledgeCollections.filter((c) => c.id !== id)
  const removed = db.knowledgeSources.filter((s) => s.collectionId === id)
  db.knowledgeSources = db.knowledgeSources.filter((s) => s.collectionId !== id)
  removed.forEach((s) => {
    try {
      fs.rmSync(path.join(STORAGE_DIR, s.path), { force: true, recursive: true })
    } catch {}
  })
  if (db.billing && removed[0]) {
    db.billing.storageUsedMB = getUsedStorage(db, removed[0].tenantId) / (1024 * 1024)
  }
  writeDb(db)
  res.status(204).send()
})

// List sources
router.get('/sources', (req, res) => {
  const { collectionId } = req.query
  const db = ensureScopes(readDb())
  const items = db.knowledgeSources.filter((s) => !collectionId || s.collectionId === collectionId)
  res.json(items)
})

// Delete source
router.delete('/sources/:id', (req, res) => {
  const id = req.params.id
  const db = ensureScopes(readDb())
  const src = db.knowledgeSources.find((s) => s.id === id)
  if (!src) return res.status(404).send()
  db.knowledgeSources = db.knowledgeSources.filter((s) => s.id !== id)
  const coll = db.knowledgeCollections.find((c) => c.id === src.collectionId)
  if (coll) coll.sourcesCount = Math.max(0, coll.sourcesCount - 1)
  try {
    fs.rmSync(path.join(STORAGE_DIR, src.path), { force: true, recursive: true })
  } catch {}
  if (db.billing && src.tenantId) {
    db.billing.storageUsedMB = getUsedStorage(db, src.tenantId) / (1024 * 1024)
  }
  writeDb(db)
  res.status(204).send()
})

// Download file
router.get('/files/:id', (req, res) => {
  const id = req.params.id
  const db = ensureScopes(readDb())
  const src = db.knowledgeSources.find((s) => s.id === id)
  if (!src) return res.status(404).send()
  res.type(src.mime)
  fs.createReadStream(path.join(STORAGE_DIR, src.path)).pipe(res)
})

// Preview
router.get('/preview/:id', (req, res) => {
  const id = req.params.id
  const db = ensureScopes(readDb())
  const src = db.knowledgeSources.find((s) => s.id === id)
  if (!src) return res.status(404).send()
  const full = path.join(STORAGE_DIR, src.path)
  if (src.mime.startsWith('text/')) {
    const buf = fs.readFileSync(full)
    res.type('text/plain').send(buf.slice(0, 2048))
  } else if (src.mime.startsWith('image/')) {
    res.type(src.mime)
    fs.createReadStream(full).pipe(res)
  } else {
    res.status(204).send()
  }
})

// Upload - naive multipart parser
router.post('/upload', (req, res) => {
  const ct = req.headers['content-type'] || ''
  const m = ct.match(/boundary=(.+)$/)
  if (!m) return res.status(400).json({ error: 'no_boundary' })
  const boundary = '--' + m[1]
  const chunks = []
  let size = 0
  req.on('data', (chunk) => {
    size += chunk.length
    if (size > 10 * 1024 * 1024) {
      req.destroy()
      return res.status(413).json({ error: 'file_too_large' })
    }
    chunks.push(chunk)
  })
  req.on('end', () => {
    const buffer = Buffer.concat(chunks)
    const parts = buffer.toString('binary').split(boundary).filter((p) => p.trim())
    const fields = {}
    let filePart = null
    for (const part of parts) {
      const [head, body] = part.split('\r\n\r\n')
      if (!head || !body) continue
      const nameMatch = /name="([^"]+)"/.exec(head)
      const filenameMatch = /filename="([^"]+)"/.exec(head)
      if (!nameMatch) continue
      const name = nameMatch[1]
      if (filenameMatch) {
        const filename = filenameMatch[1]
        const mimeMatch = /Content-Type: ([^\r\n]+)/.exec(head)
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
        const content = body.slice(0, -2) // trim \r\n
        filePart = { name: filename, mime, buffer: Buffer.from(content, 'binary') }
      } else {
        fields[name] = body.replace(/\r\n--$/, '').trim()
      }
    }
    if (!filePart) return res.status(422).json({ error: 'no_file' })
    const allowed = ['text/plain', 'text/markdown', 'application/pdf', 'image/png', 'image/jpeg']
    if (!allowed.includes(filePart.mime)) {
      return res.status(415).json({ error: 'unsupported_type' })
    }
    const { tenantId, collectionId } = fields
    if (!tenantId || !collectionId) return res.status(422).json({ error: 'missing_fields' })
    const db = ensureScopes(readDb())
    const tenant = db.tenants.find((t) => t.id === tenantId)
    if (!tenant) return res.status(404).json({ error: 'tenant_not_found' })
    const used = getUsedStorage(db, tenantId)
    const quota = (tenant.billing.storageQuotaMB || 0) * 1024 * 1024
    if (used + filePart.buffer.length > quota) {
      return res.status(413).json({ error: 'quota_exceeded' })
    }
    const sourceId = Date.now().toString()
    const rel = path.join(tenantId, collectionId, sourceId)
    const dir = path.join(STORAGE_DIR, rel)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'file.bin'), filePart.buffer)
    const src = {
      id: sourceId,
      tenantId,
      collectionId,
      name: filePart.name,
      mime: filePart.mime,
      size: filePart.buffer.length,
      path: path.join(rel, 'file.bin'),
      createdAt: new Date().toISOString(),
      status: 'uploaded',
    }
    db.knowledgeSources.push(src)
    const coll = db.knowledgeCollections.find((c) => c.id === collectionId)
    if (coll) coll.sourcesCount = (coll.sourcesCount || 0) + 1
    if (db.billing) db.billing.storageUsedMB = getUsedStorage(db, tenantId) / (1024 * 1024)
    writeDb(db)
    res.status(201).json(src)
  })
})

module.exports = router
