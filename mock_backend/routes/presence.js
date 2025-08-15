const express = require('express')
const router = express.Router()
const db = require('../db.json')
const { emit } = require('../utils/eventBus')
const { readDb } = require('../utils/db')

const presenceMap = new Map(
  Object.entries(db.presence || {}).map(([id, participants]) => [String(id), {
    chatId: String(id),
    participants: participants.map((p) => ({ ...p })),
    updatedAt: new Date().toISOString(),
  }])
)

function seedPresence(data = []) {
  presenceMap.clear()
  data.forEach(({ chatId, participants }) => {
    presenceMap.set(String(chatId), {
      chatId: String(chatId),
      participants: participants.map((p) => ({ ...p })),
      updatedAt: new Date().toISOString(),
    })
  })
}

function setPresence(chatId, participants = []) {
  presenceMap.set(String(chatId), {
    chatId: String(chatId),
    participants: participants.map((p) => ({ ...p })),
    updatedAt: new Date().toISOString(),
  })
}

function snapshot(chatId) {
  const pres = getPresence(String(chatId))
  return {
    chatId: pres.chatId,
    participants: pres.participants.map((p) => ({ ...p })),
  }
}

function sort(list) {
  return list.sort((a, b) => {
    if (a.role !== b.role) return a.role === 'operator' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

function getPresence(chatId) {
  if (!presenceMap.has(chatId)) {
    presenceMap.set(chatId, { chatId, participants: [], updatedAt: new Date().toISOString() })
  }
  return presenceMap.get(chatId)
}

router.post('/presence/list', (req, res) => {
  const { chatIds = [] } = req.body
  const result = chatIds.map((id) => {
    const pres = getPresence(String(id))
    pres.updatedAt = new Date().toISOString()
    pres.participants = sort(pres.participants)
    return pres
  })
  res.json(result)
})

router.post('/presence/join', (req, res) => {
  const { chatId, operatorId } = req.body
  const pres = getPresence(String(chatId))
  if (!pres.participants.find((p) => p.id === operatorId)) {
    pres.participants.push({ id: operatorId, name: `Op ${operatorId}`, role: 'operator', online: true })
  }
  pres.participants = sort(pres.participants)
  pres.updatedAt = new Date().toISOString()
  const dbNow = readDb()
  let tenantId
  for (const t of dbNow.tenants || []) {
    if ((t.chats || []).find(c => c.id === String(chatId))) { tenantId = t.id; break }
  }
  if (tenantId) emit(tenantId, { type: 'presence:update', chatId: String(chatId), participants: pres.participants })
  res.json(pres)
})

router.post('/presence/leave', (req, res) => {
  const { chatId, operatorId } = req.body
  const pres = getPresence(String(chatId))
  pres.participants = pres.participants.filter((p) => p.id !== operatorId)
  pres.updatedAt = new Date().toISOString()
  const dbNow = readDb()
  let tenantId
  for (const t of dbNow.tenants || []) {
    if ((t.chats || []).find(c => c.id === String(chatId))) { tenantId = t.id; break }
  }
  if (tenantId) emit(tenantId, { type: 'presence:update', chatId: String(chatId), participants: pres.participants })
  res.json(pres)
})

module.exports = { router, seedPresence, setPresence, snapshot }
