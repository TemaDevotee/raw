import { reactive } from 'vue'
import * as api from '@/api/drafts'

const state = reactive({
  draftsByChat: {},
  capture: new Set(),
})

export async function fetchDrafts(chatId) {
  const res = await api.listDrafts(chatId)
  state.draftsByChat[chatId] = Array.isArray(res.data) ? res.data : []
}

export function listByChat(chatId) {
  return state.draftsByChat[chatId] || []
}

export function count(chatId) {
  return listByChat(chatId).length
}

export async function approve(id) {
  let targetChat = null
  for (const [cid, arr] of Object.entries(state.draftsByChat)) {
    const idx = arr.findIndex((d) => String(d.id) === String(id))
    if (idx !== -1) {
      arr.splice(idx, 1)
      state.draftsByChat[cid] = [...arr]
      targetChat = cid
      break
    }
  }
  const res = await api.approveDraft(id)
  const { chatId, message } = res.data || {}
  return { chatId: targetChat || chatId, message }
}

export async function discard(id) {
  const res = await api.discardDraft(id)
  // need chatId to remove draft
  const arrEntry = Object.entries(state.draftsByChat).find(([_, arr]) =>
    arr.some((d) => String(d.id) === String(id)),
  )
  if (arrEntry) {
    const [chatId, arr] = arrEntry
    const idx = arr.findIndex((d) => String(d.id) === String(id))
    if (idx !== -1) {
      arr.splice(idx, 1)
      state.draftsByChat[chatId] = [...arr]
    }
  }
  return res.data
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
}

export default {
  state,
  fetchDrafts,
  listByChat,
  count,
  approve,
  discard,
  captureAgentReplies,
}
