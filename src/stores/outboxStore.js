import { reactive } from 'vue'
import apiClient from '@/api'
import { showToast } from '@/stores/toastStore'
import langStore from '@/stores/langStore.js'
import { isE2E } from '@/utils/e2e'

const STORAGE_KEY = 'app.outbox.v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

const state = reactive({
  queue: load(),
  isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
})

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.queue))
}

function enqueue(chatId, body) {
  const msg = {
    id: Date.now() + Math.random(),
    chatId,
    body,
    status: 'sending',
    attempts: 0,
  }
  state.queue.push(msg)
  persist()
  attemptSend(msg)
  return msg
}

function attemptSend(msg) {
  const send = () =>
    apiClient.post(`/chats/${msg.chatId}/messages`, {
      sender: 'operator',
      text: msg.body,
    })

  send()
    .then(() => {
      msg.status = 'sent'
      remove(msg)
      showToast(langStore.t('sent'), 'success')
    })
    .catch((err) => {
      if (!navigator.onLine || !err.response || err.response.status >= 500) {
        msg.status = 'pending'
        scheduleRetry(msg)
      } else {
        msg.status = 'failed'
        persist()
        showToast(langStore.t('failed'), 'error')
      }
    })
}

function scheduleRetry(msg) {
  if (isE2E) return
  const delay = Math.min(1000 * 2 ** msg.attempts, 30000)
  msg.attempts += 1
  persist()
  setTimeout(() => attemptSend(msg), delay)
}

function remove(msg) {
  const idx = state.queue.indexOf(msg)
  if (idx !== -1) {
    state.queue.splice(idx, 1)
    persist()
  }
}

function flush() {
  state.queue.forEach((m) => {
    if (m.status !== 'sent') attemptSend(m)
  })
}

window.addEventListener('online', () => {
  state.isOffline = false
  const pending = state.queue.filter((m) => m.status !== 'sent').length
  flush()
  if (pending) showToast(langStore.t('sentQueuedMessages', { count: pending }), 'info')
})
window.addEventListener('offline', () => {
  state.isOffline = true
})

export const outboxStore = { state, enqueue, flush }

