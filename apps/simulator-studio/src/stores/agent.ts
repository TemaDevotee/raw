import { defineStore } from 'pinia'
import * as admin from '../api/admin'

interface AgentState {
  state: string
  typing: boolean
}

export const useAgentStore = defineStore('agent', {
  state: () => ({ byChat: {} as Record<string, AgentState> }),
  actions: {
    setState(chatId: string, state: string) {
      const entry = this.byChat[chatId] || { state: 'idle', typing: false }
      entry.state = state
      this.byChat[chatId] = entry
    },
    setTyping(chatId: string, typing: boolean) {
      const entry = this.byChat[chatId] || { state: 'idle', typing: false }
      entry.typing = typing
      this.byChat[chatId] = entry
    },
    async pause(chatId: string) {
      await admin.pauseAgent(chatId)
    },
    async resume(chatId: string) {
      await admin.resumeAgent(chatId)
    },
    async generate(chatId: string) {
      await admin.generateAgent(chatId)
    }
  }
})
