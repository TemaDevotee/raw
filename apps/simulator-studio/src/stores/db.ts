import { defineStore } from 'pinia'
import { adminClient } from '@/lib/adminClient'

export const useDbStore = defineStore('db', {
  state: () => ({
    autosave: false as boolean,
    snapshots: [] as string[],
    loading: false as boolean,
    toast: '' as string
  }),
  actions: {
    async ping() {
      try { await adminClient.get('/admin/db/ping') } catch {}
    },
    async refreshSnapshots() {
      this.loading = true
      try {
        const { data } = await adminClient.get('/admin/db/snapshots')
        this.snapshots = data?.snapshots ?? []
      } finally { this.loading = false }
    },
    async setAutosave(on: boolean) {
      this.autosave = on
      await adminClient.post('/admin/db/autosave', { enabled: on })
      this.notify(on ? 'Autosave enabled / Автосохранение включено' : 'Autosave disabled / Автосохранение выключено')
    },
    async save(name?: string) {
      await adminClient.post('/admin/db/snapshots', { name })
      await this.refreshSnapshots()
      this.notify('Snapshot saved / Снапшот сохранён')
    },
    async load(name: string) {
      await adminClient.post(`/admin/db/snapshots/${encodeURIComponent(name)}/load`)
      this.notify(`Loaded snapshot: ${name} / Загружен снапшот: ${name}`)
    },
    async reset() {
      await adminClient.post('/admin/db/reset')
      this.notify('Mock DB reset / Мок-БД сброшена')
    },
    async export() {
      const { data } = await adminClient.get('/admin/db/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'mockdb-export.json'; a.click()
      URL.revokeObjectURL(url)
      this.notify('Mock DB exported / Мок-БД экспортирована')
    },
    notify(msg: string) { this.toast = msg; setTimeout(() => this.toast = '', 2500) }
  }
})
