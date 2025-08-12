import { reactive } from 'vue'
import { listPresence, joinChat, leaveChat } from '@/api/presence.js'
import { sortParticipants } from '@/utils/presence.js'
import { isE2E } from '@/utils/e2e'

const state = reactive({
  byChatId: {},
  pollingMs: 12000,
})

let timer = null

function get(chatId) {
  return state.byChatId[chatId] || { chatId, participants: [], updatedAt: '' }
}

function getParticipants(chatId) {
  return get(chatId).participants
}

function getTop(chatId, n = 3) {
  return getParticipants(chatId).slice(0, n)
}

function getOverflowCount(chatId, n = 3) {
  return Math.max(getParticipants(chatId).length - n, 0)
}

function count(chatId) {
  return getParticipants(chatId).length
}

function upsert(pres) {
  const sorted = sortParticipants(pres.participants)
  const existing = state.byChatId[pres.chatId]
  if (!existing) {
    state.byChatId[pres.chatId] = { chatId: pres.chatId, participants: sorted, updatedAt: pres.updatedAt }
    return
  }
  const idsOld = existing.participants.map((p) => p.id).join(',')
  const idsNew = sorted.map((p) => p.id).join(',')
  if (idsOld !== idsNew) {
    existing.participants = sorted
  }
  existing.updatedAt = pres.updatedAt
}

async function hydrate(chatIds) {
  if (!chatIds || chatIds.length === 0) return
  const res = await listPresence(chatIds)
  res.forEach(upsert)
}

async function poll() {
  if (isE2E) return
  clearInterval(timer)
  timer = setInterval(async () => {
    const ids = Object.keys(state.byChatId)
    if (!ids.length) return
    try {
      const res = await listPresence(ids)
      res.forEach(upsert)
    } catch {
      /* ignore */
    }
  }, state.pollingMs)
}

function stop() {
  clearInterval(timer)
  timer = null
}

async function join(chatId, me) {
  const pres = await joinChat(chatId, me.id)
  upsert(pres)
}

async function leave(chatId, me) {
  const pres = await leaveChat(chatId, me.id)
  upsert(pres)
}

function __e2e__setPresence(chatId, people) {
  state.byChatId[chatId] = {
    chatId,
    participants: sortParticipants(people),
    updatedAt: new Date().toISOString(),
  }
}

export const presenceStore = {
  state,
  hydrate,
  poll,
  stop,
  upsert,
  getParticipants,
  getTop,
  getOverflowCount,
  count,
  join,
  leave,
  __e2e__setPresence,
}
