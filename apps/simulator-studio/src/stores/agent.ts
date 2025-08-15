import { defineStore } from 'pinia'
import * as admin from '../api/admin'

interface AgentState {
  state: string
  typing: boolean
  error?: { code: string; message: string } | null
}

export const useAgentStore = defineStore('agent', {
  state: () => ({ byChat: {} as Record<string, AgentState> }),
  actions: {
    setState(chatId: string, state: string) {
      const entry = this.byChat[chatId] || { state: 'idle', typing: false, error: null }
      entry.state = state
      this.byChat[chatId] = entry
    },
    setTyping(chatId: string, typing: boolean) {
      const entry = this.byChat[chatId] || { state: 'idle', typing: false, error: null }
      entry.typing = typing
      this.byChat[chatId] = entry
    },
    setError(chatId: string, err: { code: string; message: string } | null) {
      const entry = this.byChat[chatId] || { state: 'idle', typing: false, error: null }
      entry.error = err
      this.byChat[chatId] = entry
    },
    async pause(chatId: string) {
      await admin.pauseAgent(chatId)
    },
    async resume(chatId: string) {
      await admin.resumeAgent(chatId)
    },
    async generate(chatId: string) {
      this.setError(chatId, null)
      await admin.generateAgent(chatId)
    }
  }
})
