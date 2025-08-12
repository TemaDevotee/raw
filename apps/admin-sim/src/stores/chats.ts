import { defineStore } from '../pinia';
import type { TranscriptItem } from '../api/client';
import { postAdminMessage, postAdminDraft, getTranscript, approveDraft, discardDraft, getPresence } from '../api/client';

export const useAdminChatStore = defineStore('adminChat', {
  state: () => ({
    transcript: [] as TranscriptItem[],
    presence: [] as any[],
    loading: false
  }),
  actions: {
    async load(chatId: string) {
      this.loading = true;
      try {
        this.transcript = await getTranscript(chatId);
        const pres = await getPresence(chatId);
        this.presence = pres?.participants || [];
      } finally {
        this.loading = false;
      }
    },
    async sendMessage(chatId: string, role: 'client' | 'agent', text: string, agentId?: string) {
      const msg = await postAdminMessage(chatId, { role, text, agentId });
      this.transcript.push(msg);
    },
    async createDraft(chatId: string, agentId: string, text: string) {
      const draft = await postAdminDraft(chatId, { agentId, text });
      this.transcript.push({ ...draft, draft: true });
    },
    async approve(chatId: string, id: string) {
      const res = await approveDraft(chatId, id);
      this.transcript = this.transcript.filter((m) => m.id !== id);
      if (res?.message) this.transcript.push(res.message);
    },
    async discard(chatId: string, id: string) {
      await discardDraft(chatId, id);
      this.transcript = this.transcript.filter((m) => m.id !== id);
    }
  }
});
