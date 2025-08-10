import { reactive } from 'vue'
import * as api from '@/api/drafts'

const state = reactive({
  draftsByChat: {},
  loadingByChat: {},
  pendingByChat: {},
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
  const draft = idx !== -1 ? arr[idx] : null
  state.pendingByChat[chatId] = state.pendingByChat[chatId] || new Set()
  state.pendingByChat[chatId].add(id)
  if (draft) draft._pending = true
  try {
    const res = await api.approveDraft(chatId, id)
    if (idx !== -1) {
      arr.splice(idx, 1)
      state.draftsByChat[chatId] = [...arr]
    }
    const { message } = res.data || {}
    return { chatId, message }
  } finally {
    if (draft) draft._pending = false
    state.pendingByChat[chatId].delete(id)
  }
}

export async function discard(chatId, id) {
  const arr = state.draftsByChat[chatId] || []
  const idx = arr.findIndex((d) => String(d.id) === String(id))
  const draft = idx !== -1 ? arr[idx] : null
  state.pendingByChat[chatId] = state.pendingByChat[chatId] || new Set()
  state.pendingByChat[chatId].add(id)
  if (draft) draft._pending = true
  try {
    const res = await api.discardDraft(chatId, id)
    if (idx !== -1) {
      arr.splice(idx, 1)
      state.draftsByChat[chatId] = [...arr]
    }
    return res.data
  } finally {
    if (draft) draft._pending = false
    state.pendingByChat[chatId].delete(id)
  }
}

export function isPending(chatId, id) {
  return !!state.pendingByChat[chatId]?.has(id)
}

export function captureAgentReplies(chatId, enabled) {
  if (enabled) state.capture.add(chatId)
  else state.capture.delete(chatId)
}

if (import.meta.env.VITE_E2E) {
  window.__e2e_addDraft = ({ chatId, text = 'stubbed agent reply' }) => {
    const draft = {
      id: Date.now().toString(),
      chatId,
      author: 'agent',
      text,
      createdAt: Date.now(),
      state: 'queued',
    }
    state.draftsByChat[chatId] = state.draftsByChat[chatId] || []
    state.draftsByChat[chatId].push(draft)
  }
  window.__draftStoreState = state
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
}
