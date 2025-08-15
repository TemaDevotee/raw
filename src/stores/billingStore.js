import { reactive } from 'vue';
import { getBilling } from '@/api/billing';

const state = reactive({
  loaded: false,
  plan: null,
  tokenQuota: 0,
  tokenUsed: 0,
  storageQuotaMB: 0,
  storageUsedMB: 0,
  period: null,
  error: null,
  tokenLocked: false,
  storageLocked: false,
});

function tokenLeft() {
  return Math.max(0, state.tokenQuota - state.tokenUsed);
}

function tokenPct() {
  return state.tokenQuota
    ? Math.min(100, Math.round((state.tokenUsed * 100) / state.tokenQuota))
    : 0;
}

function storagePct() {
  return state.storageQuotaMB
    ? Math.min(100, Math.round((state.storageUsedMB * 100) / state.storageQuotaMB))
    : 0;
}

async function hydrate() {
  try {
    const b = await getBilling();
    state.plan = b.plan;
    state.tokenQuota = b.tokenQuota;
    state.tokenUsed = b.tokenUsed;
    state.storageQuotaMB = b.storageQuotaMB || 0;
    state.storageUsedMB = b.storageUsedMB || 0;
    state.period = b.period;
    state.loaded = true;
    state.error = null;
    state.tokenLocked = state.tokenUsed >= state.tokenQuota;
    state.storageLocked = state.storageUsedMB >= state.storageQuotaMB;
  } catch (e) {
    state.error = e;
    state.loaded = true;
  }
}

export const billingStore = { state, hydrate, tokenLeft, tokenPct, storagePct };

export default billingStore;

