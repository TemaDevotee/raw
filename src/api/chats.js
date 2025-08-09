import api from './index.js'

export function snooze(chatId, minutes) {
  return api.post(`/chats/${chatId}/snooze`, { minutes })
}

export function unsnooze(chatId) {
  return api.post(`/chats/${chatId}/unsnooze`)
}

export function assign(chatId, operatorId) {
  return api.post(`/chats/${chatId}/assign`, { operatorId })
}

export function unassign(chatId) {
  return api.post(`/chats/${chatId}/unassign`)
}
