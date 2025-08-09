import { reactive } from 'vue'
import * as billingApi from '@/api/billing'
import billingStore from './billingStore'

const state = reactive({
  lastAggregates: {},
})

async function record(payload) {
  const { data } = await billingApi.recordUsage(payload)
  billingStore.state.summary = data
  billingStore.persist()
  return data
}

async function aggregate(params) {
  const { data } = await billingApi.aggregateUsage(params)
  state.lastAggregates = data
  return data
}

export default { state, record, aggregate }
