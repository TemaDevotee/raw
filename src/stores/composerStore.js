import { reactive } from 'vue'

const STORAGE_KEY = 'composer.drafts.v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

const state = reactive({ drafts: load() })

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.drafts))
}

function save(chatId, body) {
  state.drafts[chatId] = { body, updatedAt: Date.now() }
  persist()
}

function get(chatId) {
  return state.drafts[chatId] || null
}

function remove(chatId) {
  delete state.drafts[chatId]
  persist()
}

export const composerStore = { state, save, get, remove }

