import { describe, it, expect } from 'vitest';
import { useTenantsStore } from '../tenants';

function setup() {
  return useTenantsStore();
}

describe('tenants store', () => {
  it('computes usagePct', () => {
    const store = setup();
    const pct = store.usagePct({ tokenQuota: 200, tokenUsed: 50 });
    expect(pct).toBe(0.25);
  });
});
