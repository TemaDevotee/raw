import { defineStore } from '../pinia'

export const useRealtimeStore = defineStore('realtime', {
  state: () => ({
    status: 'idle' as 'idle'|'connecting'|'open'|'error'|'closed',
    lastBeatTs: 0,
    isRealtime: false
  }),
  actions: {
    setStatus(s: string) {
      this.status = s as any
      this.isRealtime = s === 'open'
    },
    setBeat(ts: number) {
      this.lastBeatTs = ts
    }
  }
})
