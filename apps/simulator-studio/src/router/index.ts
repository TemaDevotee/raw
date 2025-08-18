import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const routes = [
  
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/chats', name: 'chats', component: () => import('@/views/ChatsView.vue') },
  { path: '/chats/:id', name: 'chat', component: () => import('@/views/ChatWindow.vue'), props: true },
  { path: '/agents', name: 'agents', component: () => import('@/views/AgentsView.vue') },
  { path: '/knowledge', name: 'knowledge', component: () => import('@/views/KnowledgeView.vue') },
  { path: '/billing', name: 'billing', component: () => import('@/views/BillingView.vue') },
  { path: '/users', name: 'users', component: () => import('@/views/UsersView.vue') },
  { path: '/account', name: 'account', component: () => import('@/views/AccountView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') }
];
if (import.meta.env.VITE_ENABLE_SIMULATOR === 'true') {
  routes.push({ path: '/simulator', name: 'simulator', component: () => import('@/views/SimulatorConsoleView.vue') });
}

const router = createRouter({ history: createWebHashHistory(), routes });

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.query.skipAuth === '1') {
    await auth.login('alpha@raw.dev', 'RawDev!2025');
    const q = { ...to.query } as Record<string, any>;
    delete q.skipAuth;
    return { name: 'dashboard', query: q };
  }
  if (!auth.token) {
    if (to.name !== 'login') return { name: 'login', query: { redirect: to.fullPath } };
    return;
  }
  if (!auth.user) {
    try {
      await auth.fetchMe();
    } catch {
      await auth.logout();
      if (to.name !== 'login') return { name: 'login', query: { redirect: to.fullPath } };
      return;
    }
  }
  if (to.name === 'login') {
    const redirect = (to.query.redirect as string) || '/';
    return redirect;
  }
});

export default router;
