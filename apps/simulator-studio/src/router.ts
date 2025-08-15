import { createRouter, createWebHashHistory } from 'vue-router'
import TenantsList from './pages/TenantsList.vue'
import TenantView from './pages/TenantView.vue'
import ChatConsole from './pages/ChatConsole.vue'
import Login from './pages/Login.vue'
import NotFound from './pages/NotFound.vue'
import { useAuthStore } from './stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/tenants' },
    { path: '/tenants', component: TenantsList },
    { path: '/tenants/:tenantId', component: TenantView },
    { path: '/tenants/:tenantId/chats/:chatId/console', component: ChatConsole },
    { path: '/login', component: Login },
    { path: '/:pathMatch(.*)*', component: NotFound }
  ]
})

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()
  if (import.meta.env.VITE_DEV_LOGIN === '1') {
    if (auth.token && !auth.user) {
      try { await auth.fetchMe() } catch { auth.logout() }
    }
    if (!auth.user && to.path !== '/login') return next('/login')
    if (auth.user && to.path === '/login') return next('/tenants')
  }
  next()
})

export default router
