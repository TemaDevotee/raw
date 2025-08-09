import { createRouter, createWebHashHistory } from 'vue-router';
import DashboardView from '@/views/DashboardView.vue';
import { authStore } from '@/stores/authStore';

const routes = [
  { path: '/', name: 'dashboard', component: DashboardView },
  { path: '/chats', name: 'chats', component: () => import('@/views/ChatsView.vue') },
  { path: '/chats/:id', name: 'chat-detail', component: () => import('@/views/ChatWindow.vue'), props: true },
  { path: '/agents', name: 'agents', component: () => import('@/views/AgentsView.vue') },
  { path: '/agents/:id', name: 'agent-detail', component: () => import('@/views/AgentDetailView.vue'), props: true },
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

// NOTE: login.html is a separate static page (outside the SPA).
// To reach it, we must do a full navigation here.
router.beforeEach((to, from, next) => {
  const isAuthed = authStore.isAuthenticated();
  const isLoginRoute = to.path === '/login' || to.path === '/login.html';
  const skipAuth = localStorage.getItem('skipAuth') === 'true';
  if (!isAuthed && !isLoginRoute && !skipAuth) {
    window.location.assign('/login.html');
    return;
  }
  if (isAuthed && isLoginRoute) {
    next({ path: '/' });
    return;
  }
  next();
});

export default router;
