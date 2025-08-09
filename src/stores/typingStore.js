import { reactive } from 'vue'

const TYPING_TTL = 2500

const state = reactive({
  typing: {}, // { [chatId]: { [participantId]: expiry } }
  agentDrafting: {},
})

function startTyping(chatId, participantId) {
  if (!state.typing[chatId]) state.typing[chatId] = {}
  state.typing[chatId][participantId] = Date.now() + TYPING_TTL
}

function getTyping(chatId) {
  const map = state.typing[chatId] || {}
  return Object.keys(map)
}

function clearExpired() {
  const now = Date.now()
  for (const chatId in state.typing) {
    const map = state.typing[chatId]
    for (const pid in map) {
      if (map[pid] <= now) delete map[pid]
    }
  }
}
setInterval(clearExpired, 1000)

function setAgentDrafting(chatId, val) {
  state.agentDrafting[chatId] = val
}

function isAgentDrafting(chatId) {
  return !!state.agentDrafting[chatId]
}

export const typingStore = {
  state,
  startTyping,
  getTyping,
  setAgentDrafting,
  isAgentDrafting,
}

