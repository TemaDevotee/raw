import { reactive, ref } from 'vue'
import { showToast } from '@/stores/toastStore'
import * as draftsApi from '@/api/drafts'
import * as chatsApi from '@/api/chats'
import langStore from '@/stores/langStore.js'
import { settingsStore } from '@/stores/settingsStore.js'

const state = reactive({
  drafts: {},
  chatControl: {},
  isLoadingDrafts: false,
  isBulkSubmitting: false,
  chats: [],
})

const STORAGE_KEY = 'app.state.v2'
const slaTick = ref(0)
let slaTimer = null
let persisted = {}

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      persisted = data.chats || {}
    }
  } catch {
    /* ignore */
  }
}

function persist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    data.chats = {}
    state.chats.forEach((c) => {
      if (c.slaStartedAt) {
        data.chats[c.id] = {
          slaStartedAt: c.slaStartedAt,
          slaBreached: !!c.slaBreached,
        }
      }
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

function mergePersisted(list) {
  list.forEach((c) => {
    const p = persisted[c.id]
    if (p) {
      c.slaStartedAt = p.slaStartedAt
      c.slaBreached = p.slaBreached
    }
  })
  state.chats = list
  if (state.chats.some((c) => isSlaActive(c))) startSlaTimer()
}

function updateChat(chat) {
  const p = persisted[chat.id]
  if (p) {
    chat.slaStartedAt = p.slaStartedAt
    chat.slaBreached = p.slaBreached
  }
  const idx = state.chats.findIndex((c) => c.id === chat.id)
  if (idx !== -1) state.chats[idx] = { ...state.chats[idx], ...chat }
  else state.chats.push(chat)
  if (isSlaActive(chat)) startSlaTimer()
  persist()
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
  if (slaTimer) return
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

function setControl(chatId, control) {
  state.chatControl[chatId] = control
}

function isApproveActiveForChat(chatId, manualApprove) {
  return state.chatControl[chatId] === 'operator' ? true : !!manualApprove
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

export const chatStore = {
  state,
  setControl,
  isApproveActiveForChat,
  fetchDrafts,
  approveDraft,
  rejectDraft,
  editAndSend,
  sendAll,
  rejectAll,
  snoozeChat,
  unsnoozeChat,
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
