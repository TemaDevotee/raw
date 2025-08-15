const express = require('express')
const { requireRole } = require('../utils/adminAuth')
const { pauseChat, resumeChat, generate } = require('../utils/agentRunner')
const { getSettings, saveSettings } = require('../utils/agentSettings')

const router = express.Router()

router.use(requireRole(['owner','operator']))

router.get('/:id/settings', (req, res) => {
  const found = getSettings(req.params.id)
  if (!found) return res.status(404).json({ error: 'not_found' })
  const available = ['mock']
  if (process.env.OPENAI_API_KEY) available.push('openai')
  res.json({ settings: found.settings, availableProviders: available })
})

router.put('/:id/settings', (req, res) => {
  const { provider, systemPrompt, temperature, maxTokens } = req.body || {}
  if (provider && !['mock', 'openai'].includes(provider)) return res.status(422).json({ error: 'invalid' })
  if (temperature != null && (isNaN(temperature) || temperature < 0 || temperature > 2)) return res.status(422).json({ error: 'invalid' })
  if (maxTokens != null && (!Number.isInteger(maxTokens) || maxTokens <= 0)) return res.status(422).json({ error: 'invalid' })
  const updated = saveSettings(req.params.id, { provider, systemPrompt, temperature, maxTokens })
  if (!updated) return res.status(404).json({ error: 'not_found' })
  res.json({ settings: updated })
})

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
