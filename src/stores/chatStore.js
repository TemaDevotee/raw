import { reactive } from 'vue'
import { showToast } from '@/stores/toastStore'
import * as draftsApi from '@/api/drafts'
import langStore from '@/stores/langStore.js'

const state = reactive({
  drafts: {},
  chatControl: {},
  isLoadingDrafts: false,
  isBulkSubmitting: false,
})

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
}
