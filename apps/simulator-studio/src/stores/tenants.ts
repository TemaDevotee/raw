import { defineStore } from '../pinia'
import * as admin from '../api/admin'

export const useTenantsStore = defineStore('tenants', {
  state: () => ({
    items: [] as any[],
    total: 0,
    page: 1,
    pageSize: 20,
    sort: 'name',
    search: ''
  }),
  actions: {
    async fetchTenants() {
      const data = await admin.getTenants({
        page: this.page,
        pageSize: this.pageSize,
        sort: this.sort,
        search: this.search
      })
      this.items = data.items || []
      this.total = data.total || 0
    }
  }
})
