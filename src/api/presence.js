import api from './index.js'

export const listPresence = (chatIds) =>
  api.post('/presence/list', { chatIds }).then((r) => r.data)
export const joinChat = (chatId, operatorId) =>
  api.post('/presence/join', { chatId, operatorId }).then((r) => r.data)
export const leaveChat = (chatId, operatorId) =>
  api.post('/presence/leave', { chatId, operatorId }).then((r) => r.data)
