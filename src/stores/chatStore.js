import { reactive, ref } from 'vue'
import { showToast } from '@/stores/toastStore'
import * as draftsApi from '@/api/drafts'
import * as chatsApi from '@/api/chats'
import langStore from '@/stores/langStore.js'
import { settingsStore } from '@/stores/settingsStore.js'
import { agentStore } from '@/stores/agentStore.js'
import { isE2E } from '@/utils/e2e'

const state = reactive({
  drafts: {},
  isLoadingDrafts: false,
  isBulkSubmitting: false,
  chats: [],
})

const STORAGE_KEY = 'app.state.v2'
const slaTick = ref(0)
let slaTimer = null
let persisted = {}
const warnTimeouts = new Map()
const returnTimeouts = new Map()

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      persisted = data.chats || {}
      return
    }
  } catch {
    /* ignore */
  }
  if (globalThis.__persistedChats) {
    persisted = globalThis.__persistedChats
  }
}

function persist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    data.chats = {}
    state.chats.forEach((c) => {
      const entry = {}
      if (c.slaStartedAt) entry.slaStartedAt = c.slaStartedAt
      if (c.slaBreached) entry.slaBreached = !!c.slaBreached
      if (c.assignedTo) entry.assignedTo = c.assignedTo
      if (c.lastOperatorActivityAt) entry.lastOperatorActivityAt = c.lastOperatorActivityAt
      if (c.autoReturnAt) entry.autoReturnAt = c.autoReturnAt
      if (Object.keys(entry).length) data.chats[c.id] = entry
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    globalThis.__persistedChats = data.chats
  } catch {
    globalThis.__persistedChats = {}
  }
}

function mergePersisted(list) {
  if (!Object.keys(persisted).length) hydrate()
  list.forEach((c) => {
    const p = persisted[c.id]
    if (p) Object.assign(c, p)
    if (!c.controlBy) c.controlBy = 'agent'
    if (!('heldBy' in c)) c.heldBy = null
  })
  state.chats = list
  if (state.chats.some((c) => isSlaActive(c))) startSlaTimer()
  state.chats.forEach((c) => {
    if (c.autoReturnAt) armAutoReturn(c)
  })
}

function updateChat(chat) {
  const p = persisted[chat.id]
  if (p) Object.assign(chat, p)
  if (!chat.controlBy) chat.controlBy = 'agent'
  if (!('heldBy' in chat)) chat.heldBy = null
  const idx = state.chats.findIndex((c) => c.id === chat.id)
  if (idx !== -1) state.chats[idx] = { ...state.chats[idx], ...chat }
  else state.chats.push(chat)
  if (isSlaActive(chat)) startSlaTimer()
  if (chat.autoReturnAt) armAutoReturn(chat)
  persist()
}

function findChat(id) {
  return state.chats.find((c) => c.id === id)
}

function handleStatusChange(chat, prev) {
  if (!chat) return
  if (chat.status === 'attention') {
    if (!chat.slaStartedAt) {
      chat.slaStartedAt = new Date().toISOString()
      chat.slaBreached = false
    }
    startSlaTimer()
  } else if (prev === 'attention') {
    // leaving attention; timer may stop if no other active
    stopSlaTimerIfIdle()
  }
  persist()
}

function startSlaTimer() {
  if (isE2E || slaTimer) return
  slaTimer = setInterval(() => {
    slaTick.value++
    const minutes = settingsStore.state.workspaceSettings.attentionSLA
    state.chats.forEach((c) => {
      if (c.status === 'attention' && c.slaStartedAt) {
        const remaining = getSlaRemainingMs(c, minutes)
        if (remaining <= 0 && !c.slaBreached) {
          c.slaBreached = true
          showToast(langStore.t('sla.breached'), 'error')
        }
      }
    })
    stopSlaTimerIfIdle()
  }, 500)
}

function stopSlaTimerIfIdle() {
  if (!slaTimer) return
  if (!state.chats.some((c) => c.status === 'attention' && c.slaStartedAt && !c.slaBreached)) {
    clearInterval(slaTimer)
    slaTimer = null
  }
}

function getSlaRemainingMs(chat, slaMinutes) {
  if (!chat || !chat.slaStartedAt) return 0
  const end = Date.parse(chat.slaStartedAt) + slaMinutes * 60_000
  return Math.max(0, end - Date.now())
}

function formatSla(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function isSlaActive(chat) {
  return chat?.status === 'attention' && !!chat?.slaStartedAt
}

function isHeldByMe(chatId, meId) {
  const chat = findChat(chatId)
  return chat?.controlBy === 'operator' && chat.heldBy === meId
}

function composerEnabled(chatId, meId) {
  const chat = findChat(chatId)
  if (!chat) return false
  if (['resolved', 'ended', 'paused'].includes(chat.status)) return false
  return isHeldByMe(chatId, meId)
}

function effectiveManualApprove(chatId) {
  const chat = findChat(chatId)
  return chat?.controlBy === 'operator' ? true : !!agentStore.state.manualApprove
}

async function fetchDrafts(chatId) {
  state.isLoadingDrafts = true
  try {
    const res = await draftsApi.fetchDrafts(chatId)
    state.drafts[chatId] = res.data || []
  } catch (e) {
    showToast(langStore.t('failedToLoadDrafts'), 'error')
  } finally {
    state.isLoadingDrafts = false
  }
}

async function approveDraft(chatId, draftId) {
  const arr = state.drafts[chatId] || []
  const idx = arr.findIndex((d) => d.id === draftId)
  if (idx === -1) return
  const draft = arr[idx]
  arr.splice(idx, 1)
  try {
    await draftsApi.approveDraft(chatId, draftId)
    showToast(langStore.t('draftSent'), 'success')
  } catch (e) {
    arr.splice(idx, 0, draft)
    showToast(langStore.t('failedToSendDraft'), 'error')
  }
}

async function rejectDraft(chatId, draftId) {
  const arr = state.drafts[chatId] || []
  const idx = arr.findIndex((d) => d.id === draftId)
  if (idx === -1) return
  const draft = arr[idx]
  arr.splice(idx, 1)
  try {
    await draftsApi.rejectDraft(chatId, draftId)
    showToast(langStore.t('draftRejected'), 'success')
  } catch (e) {
    arr.splice(idx, 0, draft)
    showToast(langStore.t('failedToRejectDraft'), 'error')
  }
}

async function editAndSend(chatId, draftId, body) {
  const arr = state.drafts[chatId] || []
  const idx = arr.findIndex((d) => d.id === draftId)
  if (idx === -1) return
  const draft = arr[idx]
  arr.splice(idx, 1)
  try {
    await draftsApi.editAndSend(chatId, draftId, body)
    showToast(langStore.t('draftSent'), 'success')
  } catch (e) {
    arr.splice(idx, 0, draft)
    showToast(langStore.t('failedToSendDraft'), 'error')
  }
}

async function sendAll(chatId) {
  const arr = state.drafts[chatId] || []
  if (arr.length === 0) return
  state.isBulkSubmitting = true
  const backup = [...arr]
  state.drafts[chatId] = []
  try {
    await draftsApi.sendAll(chatId)
    showToast(langStore.t('allDraftsSent'), 'success')
  } catch (e) {
    state.drafts[chatId] = backup
    showToast(langStore.t('failedToSendDraft'), 'error')
  } finally {
    state.isBulkSubmitting = false
  }
}

async function rejectAll(chatId) {
  const arr = state.drafts[chatId] || []
  if (arr.length === 0) return
  state.isBulkSubmitting = true
  const backup = [...arr]
  state.drafts[chatId] = []
  try {
    await draftsApi.rejectAll(chatId)
    showToast(langStore.t('allDraftsRejected'), 'success')
  } catch (e) {
    state.drafts[chatId] = backup
    showToast(langStore.t('failedToRejectDraft'), 'error')
  } finally {
    state.isBulkSubmitting = false
  }
}

async function snoozeChat(chat, minutes) {
  if (!chat) return
  const prev = chat.snoozeUntil
  const until = new Date(Date.now() + minutes * 60_000).toISOString()
  chat.snoozeUntil = until
  try {
    await chatsApi.snooze(chat.id, minutes)
  } catch (e) {
    chat.snoozeUntil = prev
    showToast(langStore.t('snoozeFailed'), 'error')
  }
}

async function unsnoozeChat(chat) {
  if (!chat) return
  const prev = chat.snoozeUntil
  chat.snoozeUntil = null
  try {
    await chatsApi.unsnooze(chat.id)
  } catch (e) {
    chat.snoozeUntil = prev
    showToast(langStore.t('unsnoozeFailed'), 'error')
  }
}

async function claim(id, operator) {
  const chat = findChat(id)
  if (!chat) return
  const prev = chat.assignedTo
  chat.assignedTo = { id: operator.id, name: operator.name, avatarUrl: operator.avatarUrl }
  persist()
  try {
    await chatsApi.assignChat(id, operator.id)
    showToast(langStore.t('assign.claimed'), 'success')
  } catch (e) {
    chat.assignedTo = prev
    showToast(langStore.t('failed'), 'error')
  }
}

async function unassign(id) {
  const chat = findChat(id)
  if (!chat) return
  const prev = chat.assignedTo
  chat.assignedTo = null
  persist()
  try {
    await chatsApi.unassignChat(id)
    showToast(langStore.t('assign.unassignedToast'), 'info')
  } catch (e) {
    chat.assignedTo = prev
    showToast(langStore.t('failed'), 'error')
  }
}

async function transfer(id, operator) {
  const chat = findChat(id)
  if (!chat) return
  const prev = chat.assignedTo
  chat.assignedTo = { id: operator.id, name: operator.name, avatarUrl: operator.avatarUrl }
  persist()
  try {
    await chatsApi.transferChat(id, operator.id)
    showToast(langStore.t('assign.transferredTo', { name: operator.name }), 'success')
  } catch (e) {
    chat.assignedTo = prev
    showToast(langStore.t('failed'), 'error')
  }
}

function isAssignedToMe(chat, meId) {
  return chat?.assignedTo?.id === meId
}

function canInterfere(chat, meId) {
  return !chat?.assignedTo || chat.assignedTo.id === meId
}

async function interfere(id, me) {
  const chat = findChat(id)
  if (!chat) return
  if (!canInterfere(chat, me.id)) {
    throw new Error('ERR_ASSIGNED')
  }
  try {
    await chatsApi.interfereChat(id)
    chat.controlBy = 'operator'
    chat.heldBy = me.id
    touchActivity(id)
    return chat
  } catch (e) {
    showToast(langStore.t('failedInterfere'), 'error')
    throw e
  }
}

async function returnToAgentAction(id) {
  const chat = findChat(id)
  if (!chat) return
  clearAutoReturn(id)
  try {
    await chatsApi.returnToAgent(id)
  } catch { /* noop */ }
  chat.controlBy = 'agent'
  chat.heldBy = null
  chat.autoReturnAt = null
  persist()
  return chat
}

function touchActivity(id) {
  const chat = findChat(id)
  if (!chat) return
  chat.lastOperatorActivityAt = new Date().toISOString()
  if (agentStore.state.autoReturnMinutes > 0) {
    const ms = agentStore.state.autoReturnMinutes * 60_000
    chat.autoReturnAt = new Date(Date.now() + ms).toISOString()
    armAutoReturn(chat)
    persist()
  }
}

function cancelAutoReturn(id) {
  const chat = findChat(id)
  if (!chat) return
  chat.autoReturnAt = null
  clearAutoReturn(id)
  persist()
}

function armAutoReturn(chat) {
  if (isE2E) return
  clearAutoReturn(chat.id)
  const fireMs = Date.parse(chat.autoReturnAt) - Date.now()
  if (fireMs <= 0) return
  const warnMs = fireMs - 60_000
  if (warnMs > 0) {
    warnTimeouts.set(
      chat.id,
      setTimeout(() => {
        showToast(langStore.t('autoReturn.warn'), 'info')
      }, warnMs)
    )
  }
  returnTimeouts.set(
    chat.id,
    setTimeout(async () => {
      await returnToAgentAction(chat.id)
      showToast(langStore.t('autoReturn.returned'), 'info')
    }, fireMs)
  )
}

function clearAutoReturn(id) {
  const w = warnTimeouts.get(id)
  const r = returnTimeouts.get(id)
  if (w) clearTimeout(w)
  if (r) clearTimeout(r)
  warnTimeouts.delete(id)
  returnTimeouts.delete(id)
}

if (import.meta.env.VITE_E2E) {
  window.__e2e_addDraft = ({ chatId, text = 'stubbed agent reply' }) => {
    const arr = state.drafts[chatId] || (state.drafts[chatId] = [])
    arr.push({ id: Date.now(), sender: 'agent', text })
  }
}

export const chatStore = {
  state,
  isHeldByMe,
  composerEnabled,
  effectiveManualApprove,
  fetchDrafts,
  approveDraft,
  rejectDraft,
  editAndSend,
  sendAll,
  rejectAll,
  snoozeChat,
  unsnoozeChat,
  claim,
  unassign,
  transfer,
  interfere,
  returnToAgentAction,
  isAssignedToMe,
  canInterfere,
  touchActivity,
  cancelAutoReturn,
  mergePersisted,
  updateChat,
  handleStatusChange,
  getSlaRemainingMs,
  formatSla,
  isSlaActive,
  slaTick,
  persist,
}

hydrate()
