import { describe, it, expect, vi, afterEach } from 'vitest';
import { billingStore } from '@/stores/billingStore.js';

afterEach(() => {
  vi.restoreAllMocks();
  // reset state for isolation
  billingStore.state.loaded = false;
  billingStore.state.plan = null;
  billingStore.state.tokenQuota = 0;
  billingStore.state.tokenUsed = 0;
  billingStore.state.period = null;
  billingStore.state.error = null;
});

describe('billingStore', () => {
  it('hydrates and computes remaining tokens', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plan: 'Pro',
        tokenQuota: 200000,
        tokenUsed: 34850,
        period: { start: '2025-08-01', end: '2025-09-01' },
      }),
    } as any);

    await billingStore.hydrate();
    expect(billingStore.state.plan).toBe('Pro');
    expect(billingStore.tokenLeft()).toBe(165150);
    expect(billingStore.tokenPct()).toBe(17);
  });
});

