import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/chats', name: 'chats', component: () => import('@/views/ChatsView.vue') },
  { path: '/chats/:id', name: 'chat', component: () => import('@/views/ChatWindow.vue'), props: true },
  { path: '/console', name: 'console', component: () => import('@/views/ConsoleView.vue') },
  { path: '/agents', name: 'agents', component: () => import('@/views/AgentsView.vue') },
  { path: '/knowledge', name: 'knowledge', component: () => import('@/views/KnowledgeView.vue') },
  { path: '/billing', name: 'billing', component: () => import('@/views/PricingView.vue') },
  { path: '/account', name: 'account', component: () => import('@/views/AccountView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') }
];

const router = createRouter({ history: createWebHashHistory(), routes });

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.query.skipAuth === '1') {
    sessionStorage.setItem('skipAuth', '1');
    const q = { ...to.query } as Record<string, any>;
    delete q.skipAuth;
    return { name: 'dashboard', query: q };
  }
  if (sessionStorage.getItem('skipAuth') === '1' && !auth.authed) {
    auth.login('skip');
    sessionStorage.removeItem('skipAuth');
    if (to.name !== 'dashboard') return { name: 'dashboard' };
  }
  if (!auth.authed && to.name !== 'login') return { name: 'login' };
  if (auth.authed && to.name === 'login') return { name: 'dashboard' };
});

export default router;
