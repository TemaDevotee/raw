import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBillingStore } from '../billingStore';
import api from '@/shared/http/api';

vi.mock('@/shared/http/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock('@/stores/toast', () => ({ showToast: vi.fn() }));

describe('billing store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  it('adjustTokens updates balance', async () => {
    (api.post as any).mockResolvedValue({ data: { tokenBalance: 150 } });
    const store = useBillingStore();
    await store.adjustTokens(50, 'test');
    expect(store.tokenBalance).toBe(150);
    expect((api.post as any).mock.calls[0][0]).toBe('/admin/billing/adjust-tokens');
  });

  it('fetchPlan sets plan', async () => {
    (api.get as any).mockResolvedValue({ data: { plan: { id: 'pro', name: 'Pro', includedMonthlyTokens: 100 }, tokenBalance: 80, cycleResetAt: 1 } });
    const store = useBillingStore();
    await store.fetchPlan();
    expect(store.plan.id).toBe('pro');
    expect(store.tokenBalance).toBe(80);
  });
});
