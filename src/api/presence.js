import api from './index.js'

export const listPresence = (chatIds) => api.post('/presence/list', { chatIds })
export const joinChat = (chatId, operatorId) => api.post('/presence/join', { chatId, operatorId })
export const leaveChat = (chatId, operatorId) => api.post('/presence/leave', { chatId, operatorId })
