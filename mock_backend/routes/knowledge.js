const express = require('express')
const router = express.Router()

const collections = []

router.get('/collections', (req, res) => {
  res.json(collections)
})

router.post('/collections', (req, res) => {
  const { name = '', description = '', visibility = 'private' } = req.body || {}
  const coll = {
    id: Date.now().toString(),
    name,
    description,
    visibility,
    createdAt: new Date().toISOString(),
    sources: [],
  }
  collections.push(coll)
  res.status(201).json(coll)
})

module.exports = router
