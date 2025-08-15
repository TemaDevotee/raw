import { defineStore } from '../pinia'
import * as admin from '../api/admin'

const POLL_MS = Number(import.meta.env.VITE_CONSOLE_POLL_MS || 2000)

export const useChatConsoleStore = defineStore('chatConsole', {
  state: () => ({
    chat: null as any,
    transcript: [] as any[],
    drafts: [] as any[],
    presence: [] as any[],
    isPolling: false,
    since: 0,
    interval: null as any
  }),
  getters: {
    timeline(state) {
      const msgs = state.transcript.map(m => ({ ...m, draft: false }))
      const ds = state.drafts.map(d => ({ ...d, draft: true, ts: d.createdAt ? Date.parse(d.createdAt) : d.ts }))
      return [...msgs, ...ds].sort((a, b) => a.ts - b.ts)
    }
  },
  actions: {
    async loadChat(tenantId: string, chatId: string) {
      const res = await admin.getChats(tenantId)
      this.chat = res.items.find((c: any) => c.id === chatId) || null
    },
    async loadTranscript(chatId: string) {
      const items = await admin.getChatTranscript(chatId, this.since)
      if (items.length) {
        this.transcript.push(...items)
        this.since = Math.max(this.since, ...items.map((m: any) => m.ts))
      }
    },
    async loadDrafts(chatId: string) {
      const ds = await admin.getChatDrafts(chatId, this.since)
      if (ds.length) {
        this.drafts = ds
      }
    },
    upsertMessage(chatId: string, msg: any) {
      if (this.chat?.id !== chatId) return
      const idx = this.transcript.findIndex(m => m.id === msg.id)
      if (idx === -1) this.transcript.push(msg)
      else this.transcript[idx] = msg
    },
    upsertDraft(chatId: string, draft: any) {
      if (this.chat?.id !== chatId) return
      const idx = this.drafts.findIndex(d => d.id === draft.id)
      if (idx === -1) this.drafts.push(draft)
      else this.drafts[idx] = draft
    },
    appendChunk(chatId: string, chunk: any) {
      if (this.chat?.id !== chatId) return
      let d = this.drafts.find(x => x.id === chunk.id)
      if (!d) {
        d = { id: chunk.id, text: '', ts: Date.now(), draft: true }
        this.drafts.push(d)
      }
      d.text += chunk.text
    },
    removeDraft(chatId: string, id: string) {
      if (this.chat?.id !== chatId) return
      this.drafts = this.drafts.filter(d => d.id !== id)
    },
    setPresence(chatId: string, participants: any[]) {
      if (this.chat?.id !== chatId) return
      this.presence = participants
    },
    setStatus(chatId: string, status: string) {
      if (this.chat?.id !== chatId) return
      if (this.chat) this.chat.status = status
    },
    async sendAsUser(chatId: string, text: string) {
      await admin.postMessage(chatId, { from: 'user', text })
    },
    async sendAsAgent(chatId: string, text: string) {
      await admin.postMessage(chatId, { from: 'agent', text })
    },
    async sendAsOperator(chatId: string, text: string) {
      await admin.postMessage(chatId, { from: 'operator', text })
    },
    async createAgentDraft(chatId: string, text: string) {
      await admin.createDraft(chatId, { text })
    },
    async approveDraft(chatId: string, id: string) {
      await admin.approveDraft(chatId, id)
    },
    async discardDraft(chatId: string, id: string) {
      await admin.discardDraft(chatId, id)
    },
    startPolling(chatId: string) {
      if (this.isPolling) return
      this.isPolling = true
      this.interval = setInterval(() => {
        this.loadTranscript(chatId)
        this.loadDrafts(chatId)
      }, POLL_MS)
    },
    stopPolling() {
      if (this.interval) clearInterval(this.interval)
      this.isPolling = false
    }
  }
})
