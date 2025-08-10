import { defineStore } from '../pinia';
import type { TenantSummary, TenantDetails } from '../api/client';
import { getTenants, getTenantById } from '../api/client';

export const useTenantsStore = defineStore('tenants', {
  state: () => ({
    items: [] as TenantSummary[],
    page: 1,
    limit: 20,
    total: 0,
    q: '',
    loading: false,
    error: null as Error | null,
    details: {} as Record<string, TenantDetails | null>
  }),
  getters: {
    usagePct: () => (b: { tokenQuota: number; tokenUsed: number }) =>
      b.tokenQuota ? Math.min(1, b.tokenUsed / b.tokenQuota) : 0
  },
  actions: {
    async fetchList(params?: { q?: string; page?: number; limit?: number }) {
      this.loading = true;
      try {
        const resp = await getTenants(params ?? { q: this.q, page: this.page, limit: this.limit });
        this.items = resp.items;
        this.page = resp.page;
        this.limit = resp.limit;
        this.total = resp.total;
        this.error = null;
      } catch (e: any) {
        this.error = e;
      } finally {
        this.loading = false;
      }
    },
    async fetchDetails(id: string) {
      this.loading = true;
      try {
        const data = await getTenantById(id);
        this.details[id] = data;
        return data;
      } catch (e: any) {
        this.error = e;
        return null;
      } finally {
        this.loading = false;
      }
    }
  }
});
