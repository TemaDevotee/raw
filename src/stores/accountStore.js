import { reactive } from 'vue'
import * as accountApi from '@/api/account'

const STORAGE_KEY = 'account.plan.v1'

const plans = [
  {
    id: 'free',
    nameKey: 'plan.free',
    priceText: '$0',
    periodKey: 'period.month',
    features: ['feat.unlimitedChats'],
  },
  {
    id: 'pro',
    nameKey: 'plan.pro',
    priceText: '$12',
    periodKey: 'period.month',
    features: ['feat.unlimitedChats', 'feat.agentApprovals', 'feat.presence'],
  },
  {
    id: 'team',
    nameKey: 'plan.team',
    priceText: '$29',
    periodKey: 'period.month',
    features: ['feat.unlimitedChats', 'feat.agentApprovals', 'feat.presence', 'feat.prioritySupport'],
  },
  {
    id: 'enterprise',
    nameKey: 'plan.enterprise',
    priceText: '$99',
    periodKey: 'period.month',
    features: ['feat.unlimitedChats', 'feat.agentApprovals', 'feat.presence', 'feat.prioritySupport'],
  },
]

const state = reactive({
  currentPlanId: null,
  plans,
})

function hydrate() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (plans.some((p) => p.id === parsed.currentPlanId)) {
        state.currentPlanId = parsed.currentPlanId
      }
    } catch (_) {}
  }
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ currentPlanId: state.currentPlanId }),
  )
}

function setCurrentPlan(id) {
  state.currentPlanId = id
  persist()
}

async function upgradeTo(planId) {
  if (planId === state.currentPlanId) return
  const previous = state.currentPlanId
  state.currentPlanId = planId
  persist()
  try {
    await accountApi.upgrade(planId)
  } catch (e) {
    state.currentPlanId = previous
    persist()
    throw e
  }
}

hydrate()

export default { state, hydrate, persist, setCurrentPlan, upgradeTo }
