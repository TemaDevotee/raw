import { defineStore } from '../pinia'
import * as admin from '../api/admin'

export const useKnowledgeStore = defineStore('knowledge', {
  state: () => ({
    tenantId: '',
    collections: [] as any[],
    filesByCollection: {} as Record<string, any[]>,
    usedMB: 0,
    quotaMB: 0,
    uploading: false,
    progress: 0,
    error: ''
  }),
  actions: {
    async load(tenantId: string) {
      this.tenantId = tenantId
      const res = await admin.getKnowledge(tenantId)
      this.collections = res.collections
      this.usedMB = res.storageUsedMB
      this.quotaMB = res.storageQuotaMB
    },
    async refresh() {
      if (!this.tenantId) return
      const res = await admin.getKnowledge(this.tenantId)
      this.collections = res.collections
      this.usedMB = res.storageUsedMB
      this.quotaMB = res.storageQuotaMB
    },
    async createCollection(name: string) {
      await admin.createCollection({ tenantId: this.tenantId, name })
      await this.refresh()
    },
    async deleteCollection(id: string) {
      await admin.deleteCollection(id)
      delete this.filesByCollection[id]
      await this.refresh()
    },
    async listFiles(id: string) {
      this.filesByCollection[id] = await admin.listFiles(id)
    },
    async uploadFile(collectionId: string, file: File) {
      this.uploading = true
      this.progress = 0
      this.error = ''
      try {
        await admin.uploadFile(collectionId, file, p => (this.progress = p))
        await this.listFiles(collectionId)
        await this.refresh()
      } catch (e: any) {
        this.error = e.message || 'upload_failed'
      } finally {
        this.uploading = false
        this.progress = 0
      }
    },
    async deleteFile(collectionId: string, fileId: string) {
      await admin.deleteFile(fileId)
      const list = this.filesByCollection[collectionId] || []
      this.filesByCollection[collectionId] = list.filter(f => f.id !== fileId)
      await this.refresh()
    },
    async downloadFile(fileId: string) {
      const blob = await admin.downloadFile(fileId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = ''
      a.click()
      URL.revokeObjectURL(url)
    }
  }
})
