import { reactive } from 'vue'
import * as billingApi from '@/api/billing'

const STORAGE_KEY = 'billing.summary.v1'

const state = reactive({
  summary: null,
  loading: false,
})

function persist() {
  if (state.summary) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.summary))
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      state.summary = JSON.parse(raw)
    }
  } catch {
    state.summary = null
  }
}

async function hydrate() {
  load()
  await refresh()
}

async function refresh() {
  state.loading = true
  try {
    const { data } = await billingApi.getUsageSummary()
    state.summary = data
    persist()
  } finally {
    state.loading = false
  }
}

async function purchase(tokens) {
  const { data } = await billingApi.purchaseTokens(tokens)
  state.summary = data
  persist()
}

function applyLocalDelta(tokens) {
  if (!state.summary) return
  state.summary.usedThisPeriod += tokens
  const included = state.summary.includedMonthlyTokens || 0
  if (state.summary.usedThisPeriod > included) {
    const excess = state.summary.usedThisPeriod - included
    state.summary.remainingInPeriod = 0
    state.summary.topupBalance = Math.max(0, state.summary.topupBalance - excess)
  } else {
    state.summary.remainingInPeriod = included - state.summary.usedThisPeriod
  }
  state.summary.totalRemaining =
    state.summary.remainingInPeriod + state.summary.topupBalance
  persist()
}

function periodRemainingPct() {
  if (!state.summary || !state.summary.includedMonthlyTokens) return 0
  return state.summary.remainingInPeriod / state.summary.includedMonthlyTokens
}

function totalRemainingFmt() {
  if (!state.summary) return '0'
  const v = state.summary.totalRemaining
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(v)
}

load()

export default {
  state,
  hydrate,
  refresh,
  purchase,
  applyLocalDelta,
  periodRemainingPct,
  totalRemainingFmt,
  persist,
}
