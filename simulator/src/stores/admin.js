import { defineStore } from 'pinia';
import * as api from '../api/AdminApi';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    plans: [],
    users: [],
    total: 0,
    page: 1,
    pageSize: 20
  }),
  getters: {
    totalPages: (s) => Math.ceil(s.total / s.pageSize)
  },
  actions: {
    async loadPlans() {
      this.plans = await api.getPlans();
    },
    async fetchUsers(params = {}) {
      const resp = await api.getUsers(params);
      this.users = resp.items;
      this.total = resp.total;
      this.page = resp.page;
      this.pageSize = resp.pageSize;
    },
    fetchUser: api.getUser,
    fetchWorkspaces: api.getUserWorkspaces,
    fetchAgents: api.getUserAgents,
    fetchKnowledge: api.getUserKnowledge,
    fetchChats: api.getUserChats
  }
});
