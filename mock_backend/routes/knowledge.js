const express = require('express')
const router = express.Router()

const collections = []

router.get('/collections', (req, res) => {
  res.json(collections)
})

router.post('/collections', (req, res) => {
  const { name = '' } = req.body || {}
  const coll = {
    id: Date.now().toString(),
    name,
    createdAt: new Date().toISOString(),
    sourceCount: 0,
  }
  collections.push(coll)
  res.status(201).json(coll)
})

module.exports = router
