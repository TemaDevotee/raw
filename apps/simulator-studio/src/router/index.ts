import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/chats', name: 'chats', component: () => import('@/views/ChatsView.vue') },
  { path: '/chats/:id', name: 'chat', component: () => import('@/views/ChatWindow.vue'), props: true },
  { path: '/agents', name: 'agents', component: () => import('@/views/AgentsView.vue') },
  { path: '/agents/:id', name: 'agent-detail', component: () => import('@/views/AgentDetailView.vue'), props: true },
  { path: '/knowledge', name: 'knowledge', component: () => import('@/views/KnowledgeView.vue') },
  { path: '/knowledge/:id', name: 'knowledge-group', component: () => import('@/views/KnowledgeGroupDetailView.vue'), props: true },
  { path: '/billing', name: 'billing', component: () => import('@/views/PricingView.vue') },
  { path: '/account', name: 'account', component: () => import('@/views/AccountView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
]
export default createRouter({ history: createWebHashHistory(), routes })
