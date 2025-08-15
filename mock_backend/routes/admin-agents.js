const express = require('express')
const { requireRole } = require('../utils/adminAuth')
const { pauseChat, resumeChat, generate } = require('../utils/agentRunner')

const router = express.Router()

router.use(requireRole(['owner','operator']))

router.post('/:id/pause', (req, res) => {
  if (!pauseChat(req.params.id)) return res.status(404).json({ error: 'not_found' })
  res.json({ state: 'paused' })
})

router.post('/:id/resume', (req, res) => {
  if (!resumeChat(req.params.id)) return res.status(404).json({ error: 'not_found' })
  res.json({ state: 'idle' })
})

router.post('/:id/generate', (req, res) => {
  if (!generate(req.params.id)) return res.status(404).json({ error: 'not_found' })
  res.json({ queued: true })
})

module.exports = router
