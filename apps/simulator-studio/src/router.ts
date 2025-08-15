import { createRouter, createWebHashHistory } from 'vue-router'
import TenantsList from './pages/TenantsList.vue'
import TenantView from './pages/TenantView.vue'
import ChatConsole from './pages/ChatConsole.vue'
import NotFound from './pages/NotFound.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/tenants' },
    { path: '/tenants', component: TenantsList },
    { path: '/tenants/:tenantId', component: TenantView },
    { path: '/tenants/:tenantId/chats/:chatId/console', component: ChatConsole },
    { path: '/:pathMatch(.*)*', component: NotFound }
  ]
})
