import api from './index.js'

export const getUsageSummary = () => api.get('/account/usage')
export const recordUsage = (payload) => api.post('/usage/record', payload)
export const aggregateUsage = (params) => api.get('/usage/aggregate', { params })
export const purchaseTokens = (tokens) => api.post('/account/purchase', { tokens })
