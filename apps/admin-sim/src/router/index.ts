import { createRouter, createWebHistory } from 'vue-router';
import TenantsList from '../views/TenantsList.vue';
import TenantDetails from '../views/TenantDetails.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/tenants' },
    { path: '/tenants', component: TenantsList },
    { path: '/tenants/:id', component: TenantDetails }
  ]
});
