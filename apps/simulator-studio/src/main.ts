import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';
import { useAuthStore } from '@/stores/authStore';
import { useBillingStore } from '@/stores/billingStore';
import { useSimulatorStore } from '@/stores/simulatorStore';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
const auth = useAuthStore();
auth.hydrate();
if (auth.token) {
  auth.fetchMe().catch(() => auth.logout());
  const billing = useBillingStore();
  billing.fetchPlan();
  const sim = useSimulatorStore();
  if (sim.enabled) sim.connectWS();
}
app.mount('#app');
