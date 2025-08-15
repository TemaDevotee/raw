import { defineStore } from 'pinia'
import * as api from '../api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    token: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('studio.token') || '' : ''
  }),
  getters: {
    role: (s) => s.user?.role || null
  },
  actions: {
    async login(email: string, password: string) {
      const res = await api.login(email, password)
      this.token = res.token
      this.user = res.user
      sessionStorage.setItem('studio.token', this.token)
    },
    async fetchMe() {
      if (!this.token) return
      const res = await api.me(this.token)
      this.user = res.user
    },
    async logout() {
      if (this.token) await api.logout(this.token)
      this.token = ''
      this.user = null
      sessionStorage.removeItem('studio.token')
    },
    can(roles: string[]) {
      if (import.meta.env.VITE_DEV_LOGIN !== '1') return true
      const r = this.user?.role
      return r ? roles.includes(r) : false
    }
  }
})
