import { createRouter, createWebHashHistory } from 'vue-router';
import DashboardView from '@/views/DashboardView.vue';
import AgentDetailView from '@/views/AgentDetailView.vue';
import { useAuthStore } from '@/stores/authStore';
import langStore from '@/stores/langStore';
import { showToast } from '@/stores/toastStore';

const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
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

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!auth.token && to.name !== 'login') return { name: 'login' };
  if (auth.token && to.name === 'login') return { path: '/' };
});

router.afterEach(() => {
  if (sessionStorage.getItem('agent-not-found-toast')) {
    sessionStorage.removeItem('agent-not-found-toast');
    setTimeout(() => showToast(langStore.t('agent.notFound.title')), 0);
  }
});

export default router;
