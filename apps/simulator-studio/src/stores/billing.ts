import { defineStore } from 'pinia'
import * as admin from '../api/admin'

export const useBillingStore = defineStore('billing', {
  state: () => ({
    tenantId: '',
    summary: null as any,
    ledger: [] as any[],
    cursor: null as string | null,
    plans: {} as Record<string, any>,
  }),
  actions: {
    async load(id: string) {
      this.tenantId = id
      const res = await admin.getBilling(id)
      this.summary = res.billing
      if (!Object.keys(this.plans).length) {
        this.plans = await admin.getPlans()
      }
      this.ledger = []
      this.cursor = null
      await this.loadLedger()
    },
    async loadLedger() {
      if (!this.tenantId) return
      const { items, nextCursor } = await admin.getLedger(this.tenantId, this.cursor || undefined)
      this.ledger.push(...items)
      this.cursor = nextCursor
    },
    async credit(amount: number, reason: string) {
      await admin.creditTokens({ tenantId: this.tenantId, amount, reason })
      await this.load(this.tenantId)
    },
    async debit(amount: number, reason: string) {
      await admin.debitTokens({ tenantId: this.tenantId, amount, reason })
      await this.load(this.tenantId)
    },
    async reset(reason?: string) {
      await admin.resetPeriod({ tenantId: this.tenantId, reason })
      await this.load(this.tenantId)
    },
    async changePlan(plan: string, reason?: string) {
      await admin.changePlan({ tenantId: this.tenantId, plan, reason })
      await this.load(this.tenantId)
    },
    async updateQuotas(tokenQuota?: number, storageQuotaMB?: number, reason?: string) {
      await admin.updateQuotas({ tenantId: this.tenantId, tokenQuota, storageQuotaMB, reason })
      await this.load(this.tenantId)
    }
  }
})
