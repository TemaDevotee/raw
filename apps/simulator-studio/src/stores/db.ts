import { defineStore } from 'pinia';
import api from '@studio/adminClient';
import { showToast } from '@studio/stores/toast';
import { t } from '@/i18n.js';

const lang = navigator.language.startsWith('ru') ? 'ru' : 'en';

export const useDbStore = defineStore('db', {
  state: () => ({ autosave: false, snapshots: [] as string[], busy: false }),
  actions: {
    async refresh() {
      try {
        const { data } = await api.get('/admin/db/snapshots');
        this.snapshots = data.snapshots || [];
        this.autosave = !!data.autosave;
      } catch {
        showToast('Error / Ошибка', 'error');
      }
    },
    async toggleAutosave() {
      this.busy = true;
      try {
        const { data } = await api.post('/admin/db/autosave/toggle', { enabled: !this.autosave });
        this.autosave = !!data.enabled;
        showToast(t(lang, this.autosave ? 'autosaveOn' : 'autosaveOff'));
      } catch {
        showToast('Error / Ошибка', 'error');
      } finally {
        this.busy = false;
      }
    },
    async saveSnapshot() {
      this.busy = true;
      try {
        await api.post('/admin/db/snapshot/save');
        showToast(t(lang, 'savedSnapshot'));
      } catch {
        showToast('Error / Ошибка', 'error');
      } finally {
        this.busy = false;
      }
    },
    async loadSnapshot(name: string) {
      this.busy = true;
      try {
        await api.post('/admin/db/snapshot/load', { name });
        showToast(t(lang, 'loadedSnapshot'));
      } catch {
        showToast('Error / Ошибка', 'error');
      } finally {
        this.busy = false;
      }
    },
    async resetDb() {
      this.busy = true;
      try {
        await api.post('/admin/db/snapshot/reset');
        showToast(t(lang, 'reset'));
      } catch {
        showToast('Error / Ошибка', 'error');
      } finally {
        this.busy = false;
      }
    },
    async exportDb() {
      try {
        location.href = `${import.meta.env.VITE_API_BASE}/admin/db/export`;
        showToast(t(lang, 'exported'));
      } catch {
        showToast('Error / Ошибка', 'error');
      }
    },
  }
});
