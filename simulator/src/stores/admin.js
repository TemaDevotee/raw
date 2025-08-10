import { defineStore } from 'pinia';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: []
  }),
  actions: {
    async fetchUsers() {
      const res = await fetch(`${API_BASE}/admin/users`);
      this.users = await res.json();
    },
    async fetchUser(id) {
      const res = await fetch(`${API_BASE}/admin/users/${id}`);
      if (!res.ok) return null;
      return await res.json();
    },
    async fetchList(id, type) {
      const res = await fetch(`${API_BASE}/admin/users/${id}/${type}`);
      if (!res.ok) return [];
      return await res.json();
    }
  }
});
