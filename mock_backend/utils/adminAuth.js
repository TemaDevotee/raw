const ADMIN_KEY = process.env.ADMIN_KEY || 'dev-admin-key'
const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN || 'http://localhost:5199'

function requireAdmin(req, res, next) {
  const key = req.header('X-Admin-Key')
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'unauthorized' })
  const origin = req.header('origin')
  if (origin && origin !== ADMIN_ORIGIN) return res.status(403).json({ error: 'forbidden' })
  next()
}

const idemCache = new Map()
function withIdempotency(handler) {
  return async (req, res, next) => {
    const idem = req.header('Idempotency-Key')
    if (idem) {
      const cached = idemCache.get(idem)
      if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
        res.set('x-idempotent-replay', '1')
        return res.status(cached.status).json(cached.body)
      }
    }
    const origJson = res.json.bind(res)
    res.json = (body) => {
      if (idem) {
        idemCache.set(idem, { ts: Date.now(), status: res.statusCode, body })
      }
      return origJson(body)
    }
    return handler(req, res, next)
  }
}

module.exports = { requireAdmin, withIdempotency }
