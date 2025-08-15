import { defineStore } from '../pinia'
import * as admin from '../api/admin'

export interface SnapshotInfo {
  name: string
  created: string
  size: number
}

interface Settings {
  autosaveEnabled: boolean
  journalEnabled: boolean
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('studio.mockdb.settings')
    if (raw) return JSON.parse(raw)
  } catch {}
  return { autosaveEnabled: false, journalEnabled: false }
}

function saveSettings(s: Settings) {
  localStorage.setItem('studio.mockdb.settings', JSON.stringify(s))
}

export const useMockDbStore = defineStore('mockdb', {
  state: () => ({
    snapshots: [] as SnapshotInfo[],
    loading: false,
    autosaveEnabled: loadSettings().autosaveEnabled,
    journalEnabled: loadSettings().journalEnabled
  }),
  actions: {
    toggleAutosave() {
      this.autosaveEnabled = !this.autosaveEnabled
      saveSettings({ autosaveEnabled: this.autosaveEnabled, journalEnabled: this.journalEnabled })
    },
    toggleJournal() {
      this.journalEnabled = !this.journalEnabled
      saveSettings({ autosaveEnabled: this.autosaveEnabled, journalEnabled: this.journalEnabled })
    },
    async listSnapshots() {
      this.loading = true
      try {
        this.snapshots = await admin.listMockDbSnapshots()
      } finally {
        this.loading = false
      }
    },
    async saveCurrent() {
      await admin.saveMockDb()
      await this.listSnapshots()
    },
    async load(name: string) {
      await admin.loadMockDb(name)
    },
    async remove(name: string) {
      await admin.deleteMockDbSnapshot(name)
      await this.listSnapshots()
    },
    async download(name: string) {
      await admin.downloadMockDbSnapshot(name)
    }
  }
})
