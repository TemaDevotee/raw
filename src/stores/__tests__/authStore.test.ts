import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setActivePinia(createPinia());
  });

  it('persists tenants and current tenant', () => {
    const store = useAuthStore();
    store.setSession(
      't',
      { id: '1', email: 'u@e', name: 'U' },
      [{ id: 'a', name: 'A', role: 'owner' }],
      'a',
    );
    const fresh = useAuthStore();
    fresh.hydrate();
    expect(fresh.tenants).toHaveLength(1);
    expect(fresh.tenants[0].id).toBe('a');
    expect(fresh.currentTenantId).toBe('a');
    expect(fresh.user?.tenant).toBe('a');
  });
});
