import { reactive } from 'vue'
import * as api from '@/api/drafts'

const state = reactive({
  draftsByChat: {},
  loadingByChat: {},
  pendingApprove: {},
  pendingDiscard: {},
  capture: new Set(),
})

export async function fetchDrafts(chatId) {
  state.loadingByChat[chatId] = true
  try {
    const res = await api.listDrafts(chatId)
    state.draftsByChat[chatId] = Array.isArray(res.data) ? res.data : []
  } finally {
    state.loadingByChat[chatId] = false
  }
}

export function isLoading(chatId) {
  return !!state.loadingByChat[chatId]
}

export function listByChat(chatId) {
  return state.draftsByChat[chatId] || []
}

export function count(chatId) {
  return listByChat(chatId).length
}

export async function approve(chatId, id) {
  const arr = state.draftsByChat[chatId] || []
  const idx = arr.findIndex((d) => String(d.id) === String(id))
  state.pendingApprove[chatId] = state.pendingApprove[chatId] || new Set()
  state.pendingApprove[chatId].add(id)
  try {
    const res = await api.approveDraft(chatId, id)
    if (idx !== -1) {
      arr.splice(idx, 1)
      state.draftsByChat[chatId] = [...arr]
    }
    return res.data
  } finally {
    state.pendingApprove[chatId].delete(id)
  }
}

export async function discard(chatId, id) {
  const arr = state.draftsByChat[chatId] || []
  const idx = arr.findIndex((d) => String(d.id) === String(id))
  state.pendingDiscard[chatId] = state.pendingDiscard[chatId] || new Set()
  state.pendingDiscard[chatId].add(id)
  try {
    const res = await api.discardDraft(chatId, id)
    if (idx !== -1) {
      arr.splice(idx, 1)
      state.draftsByChat[chatId] = [...arr]
    }
    return res.data
  } finally {
    state.pendingDiscard[chatId].delete(id)
  }
}

export function isPending(chatId, id) {
  return !!state.pendingApprove[chatId]?.has(id) || !!state.pendingDiscard[chatId]?.has(id)
}

export function seedDrafts(chatId, drafts) {
  state.draftsByChat[chatId] = drafts
}

export function waitUntilIdle(chatId) {
  return new Promise((resolve) => {
    const check = () => {
      if (!state.pendingApprove[chatId]?.size && !state.pendingDiscard[chatId]?.size) resolve()
      else setTimeout(check, 20)
    }
    check()
  })
}

export function captureAgentReplies(chatId, enabled) {
  if (enabled) state.capture.add(chatId)
  else state.capture.delete(chatId)
}

if (import.meta.env.VITE_E2E) {
  window.__draftStoreState = state
  window.__draftStoreWaitUntilIdle = waitUntilIdle
}

export default {
  state,
  fetchDrafts,
  listByChat,
  count,
  isLoading,
  approve,
  discard,
  captureAgentReplies,
  isPending,
  seedDrafts,
  waitUntilIdle,
}
