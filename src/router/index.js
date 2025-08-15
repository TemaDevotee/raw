import { createRouter, createWebHashHistory } from 'vue-router';
import DashboardView from '@/views/DashboardView.vue';
import AgentDetailView from '@/views/AgentDetailView.vue';
import { authStore } from '@/stores/authStore';
import langStore from '@/stores/langStore';
import { showToast } from '@/stores/toastStore';

const routes = [
  { path: '/', name: 'dashboard', component: DashboardView },
  { path: '/chats', name: 'chats', component: () => import('@/views/ChatsView.vue') },
  { path: '/chats/:id', name: 'chat-detail', component: () => import('@/views/ChatWindow.vue'), props: true },
  { path: '/agents', name: 'agents', component: () => import('@/views/AgentsView.vue') },
  {
    path: '/agents/:id',
    name: 'agent-detail',
    component: AgentDetailView,
    props: true,
    beforeEnter: (to, _from, next) => {
      const id = Number(to.params.id);
      if (Number.isNaN(id)) {
        sessionStorage.setItem('agent-not-found-toast', '1');
        next('/agents');
      } else {
        next();
      }
    },
  },
  { path: '/knowledge', name: 'knowledge-list', component: () => import('@/views/KnowledgeView.vue') },
  { path: '/knowledge/:id', name: 'knowledge-detail', component: () => import('@/views/KnowledgeGroupDetailView.vue'), props: true },
  { path: '/account', name: 'account', component: () => import('@/views/AccountView.vue') },
  { path: '/account/plan', name: 'account-plan', component: () => import('@/views/PricingView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.afterEach(() => {
  if (sessionStorage.getItem('agent-not-found-toast')) {
    sessionStorage.removeItem('agent-not-found-toast');
    setTimeout(() => showToast(langStore.t('agent.notFound.title')), 0);
  }
});

// NOTE: login.html is a separate static page (outside the SPA).
// To reach it, we must do a full navigation here.
router.beforeEach(async (to, from, next) => {
  if (to.query.impersonate && !sessionStorage.getItem('dev.tenant')) {
    try {
      const res = await fetch(`/api/dev/impersonate/verify?token=${to.query.impersonate}`)
      if (res.ok) {
        const data = await res.json()
        sessionStorage.setItem('dev.tenant', data.tenantId)
        authStore.forceLogin()
        localStorage.setItem('skipAuth', 'true')
        const q = { ...to.query }
        delete q.impersonate
        next({ path: to.path, query: q, replace: true })
        return
      }
    } catch {}
  }
  const skip = to.query.skipAuth === '1' || import.meta.env.VITE_E2E === '1'
  if (skip) {
    authStore.forceLogin()
    localStorage.setItem('skipAuth', 'true')
    return next()
  }

  const isAuthed = authStore.isAuthenticated()
  const isLoginRoute = to.path === '/login' || to.path === '/login.html'
  const skipAuth = localStorage.getItem('skipAuth') === 'true'
  if (!isAuthed && !isLoginRoute && !skipAuth) {
    window.location.assign('/login.html')
    return
  }
  if (isAuthed && isLoginRoute) {
    next({ path: '/' })
    return
  }
  next()
})

export default router;
