import { reactive } from 'vue';
import { getBilling } from '@/api/billing';

const state = reactive({
  loaded: false,
  plan: null,
  tokenQuota: 0,
  tokenUsed: 0,
  period: null,
  error: null,
});

function tokenLeft() {
  return Math.max(0, state.tokenQuota - state.tokenUsed);
}

function tokenPct() {
  return state.tokenQuota
    ? Math.min(100, Math.round((state.tokenUsed * 100) / state.tokenQuota))
    : 0;
}

async function hydrate() {
  try {
    const b = await getBilling();
    state.plan = b.plan;
    state.tokenQuota = b.tokenQuota;
    state.tokenUsed = b.tokenUsed;
    state.period = b.period;
    state.loaded = true;
    state.error = null;
  } catch (e) {
    state.error = e;
    state.loaded = true;
  }
}

export const billingStore = { state, hydrate, tokenLeft, tokenPct };

export default billingStore;

