import { defineStore } from '../pinia'
import * as admin from '../api/admin'

export const useTenantDetailStore = defineStore('tenantDetail', {
  state: () => ({
    tenant: null as any,
    activeTab: 'workspaces',
    workspaces: [] as any[],
    agents: [] as any[],
    chats: [] as any[],
    transcripts: {} as Record<string, any[]>,
    billing: null as any
  }),
  actions: {
    async loadTenant(id: string) {
      this.tenant = await admin.getTenant(id)
    },
    async loadWorkspaces(id: string) {
      if (!this.workspaces.length) {
        this.workspaces = await admin.getWorkspaces(id)
      }
    },
    async loadAgents(id: string) {
      if (!this.agents.length) {
        this.agents = await admin.getAgents(id)
      }
    },
    async loadChats(id: string) {
      if (!this.chats.length) {
        const res = await admin.getChats(id)
        this.chats = res.items
      }
    },
    async loadTranscript(id: string, chatId: string) {
      if (!this.transcripts[chatId]) {
        this.transcripts[chatId] = await admin.getChatTranscript(id, chatId)
      }
    },
    async loadBilling(id: string) {
      if (!this.billing) {
        this.billing = await admin.getBilling(id)
      }
    }
  }
})
