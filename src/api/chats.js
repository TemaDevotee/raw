import api from './index.js'

export function snooze(chatId, minutes) {
  return api.post(`/chats/${chatId}/snooze`, { minutes })
}

export function unsnooze(chatId) {
  return api.post(`/chats/${chatId}/unsnooze`)
}

export const assignChat = (id, operatorId) => api.post(`/chats/${id}/assign`, { operatorId })
export const unassignChat = (id) => api.post(`/chats/${id}/unassign`, {})
export const transferChat = (id, operatorId) =>
  api.post(`/chats/${id}/transfer`, { operatorId })
export const interfereChat = (id) => api.post(`/chats/${id}/interfere`, {})
export const returnToAgent = (id) => api.post(`/chats/${id}/return`, {})
