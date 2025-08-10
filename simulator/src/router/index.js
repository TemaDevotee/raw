import { createRouter, createWebHashHistory } from 'vue-router';
import Overview from '../views/Overview.vue';
import UserDetail from '../views/UserDetail.vue';

const routes = [
  { path: '/', component: Overview },
  { path: '/users/:id', component: UserDetail }
];

export default createRouter({
  history: createWebHashHistory(),
  routes
});
