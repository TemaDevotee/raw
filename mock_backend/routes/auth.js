const express = require('express')
const { nanoid } = require('nanoid')
const { readDb } = require('../utils/db')

const router = express.Router()
const sessions = new Map()

function findUser(email) {
  const db = readDb()
  for (const t of db.tenants || []) {
    for (const u of t.users || []) {
      if (u.email === email) return u
    }
  }
  return null
}

router.post('/login', (req, res) => {
  if (process.env.DEV_LOGIN !== '1') return res.status(404).end()
  const { email, password } = req.body || {}
  const user = findUser(email)
  if (!user || user.password !== password) return res.status(401).json({ error: 'invalid_credentials' })
  const token = nanoid()
  sessions.set(token, { user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId }, exp: Date.now() + 24*60*60*1000 })
  res.json({ token, user: sessions.get(token).user })
})

function authMiddleware(req, _res, next) {
  const auth = req.header('Authorization') || ''
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7)
    const sess = sessions.get(token)
    if (sess && sess.exp > Date.now()) {
      req.user = sess.user
    }
  }
  next()
}

router.get('/me', authMiddleware, (req, res) => {
  if (process.env.DEV_LOGIN !== '1') return res.status(404).end()
  if (!req.user) return res.status(401).json({ error: 'unauthorized' })
  res.json({ user: req.user })
})

router.post('/logout', authMiddleware, (req, res) => {
  if (process.env.DEV_LOGIN !== '1') return res.status(404).end()
  const auth = req.header('Authorization') || ''
  if (auth.startsWith('Bearer ')) {
    sessions.delete(auth.slice(7))
  }
  res.json({ ok: true })
})

module.exports = { router, authMiddleware }
