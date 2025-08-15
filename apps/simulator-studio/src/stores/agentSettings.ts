import { defineStore } from 'pinia'
import * as admin from '../api/admin'

export interface AgentSettings {
  provider: 'mock' | 'openai'
  systemPrompt: string
  temperature: number
  maxTokens: number
}

interface Entry extends AgentSettings {
  loading: boolean
  saving: boolean
  available: string[]
  providerError: { code: string; message: string } | null
}

export const useAgentSettingsStore = defineStore('agentSettings', {
  state: () => ({ byChat: {} as Record<string, Entry> }),
  actions: {
    async load(chatId: string) {
      const res = await admin.getAgentSettings(chatId)
      this.byChat[chatId] = { ...res.settings, loading: false, saving: false, available: res.availableProviders, providerError: null }
    },
    async save(chatId: string, patch: Partial<AgentSettings>) {
      const entry = this.byChat[chatId]
      if (!entry) return
      entry.saving = true
      try {
        const res = await admin.saveAgentSettings(chatId, patch)
        this.byChat[chatId] = { ...entry, ...res.settings, saving: false, providerError: null }
      } finally {
        entry.saving = false
      }
    },
    setProviderError(chatId: string, err: { code: string; message: string } | null) {
      const entry = this.byChat[chatId]
      if (entry) entry.providerError = err
    },
    clearError(chatId: string) {
      const entry = this.byChat[chatId]
      if (entry) entry.providerError = null
    }
  }
})
