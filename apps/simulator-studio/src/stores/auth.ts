import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authed: sessionStorage.getItem('authed') === '1',
    token: sessionStorage.getItem('token') || '',
    user: JSON.parse(sessionStorage.getItem('user') || 'null'),
    tenant: JSON.parse(sessionStorage.getItem('tenant') || 'null')
  }),
  actions: {
    login(token: string, user?: any, tenant?: any) {
      this.authed = true;
      this.token = token;
      this.user = user || null;
      this.tenant = tenant || null;
      sessionStorage.setItem('authed', '1');
      if (token) sessionStorage.setItem('token', token);
      if (user) sessionStorage.setItem('user', JSON.stringify(user));
      if (tenant) sessionStorage.setItem('tenant', JSON.stringify(tenant));
    },
    setSession(user: any, tenant: any) {
      this.user = user;
      this.tenant = tenant;
      sessionStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('tenant', JSON.stringify(tenant));
    },
    logout() {
      this.authed = false;
      this.token = '';
      this.user = null;
      this.tenant = null;
      sessionStorage.removeItem('authed');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('tenant');
    }
  }
});
