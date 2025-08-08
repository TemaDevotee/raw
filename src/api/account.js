import api from './index.js'

export function upgrade(planId) {
  return api.post('/account/upgrade', { planId })
}

export default { upgrade }
