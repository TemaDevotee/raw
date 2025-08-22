import './main.css'
import { isE2E } from '@/utils/e2e'
import { installE2EStubs } from '@/utils/e2eFetchStub'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { showToast } from '@/stores/toastStore'
import { workspaceStore } from '@/stores/workspaceStore'
import accountStore from '@/stores/accountStore'
import { initLogoutListener } from '@/stores/logout.js'
import { useAuthStore } from '@/stores/authStore'
import { pinia } from '@/stores/pinia'
import { agentStore } from '@/stores/agentStore'
import { knowledgeStore } from '@/stores/knowledgeStore'
import { chatStore } from '@/stores/chatStore.js'
import draftStore from '@/stores/draftStore.js'
import billingStore from '@/stores/billingStore.js'
import { presenceStore } from '@/stores/presenceStore.js'

if (isE2E) {
  installE2EStubs()
  window.__E2E__ = true
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker
        .getRegistrations()
        .then((rs) => rs.forEach((r) => r.unregister()))
        .catch(() => {})
    } catch {}
  }
}

const app = createApp(App)
app.use(pinia)
app.use(router)

const authStore = useAuthStore()
authStore.hydrate()
if (location.pathname === '/login.html') {
  // standalone login page; app is not mounted
} else if (!authStore.token) {
  location.href = '/login.html'
} else {
  app.mount('#app')
}

// Global error handling to prevent white-screen on runtime errors
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue error]', err, info);
  try { showToast(err?.message || 'Unexpected error', 'error', 5000); } catch (_) { /* noop */ }
};
window.addEventListener('error', (e) => {
  console.error('[Window error]', e.error || e);
  try { showToast(e?.message || 'Unexpected error', 'error', 5000); } catch (_) { /* noop */ }
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled rejection]', e.reason || e);
  try {
    const msg = (e?.reason && (e.reason.message || e.reason.toString())) || 'Unexpected async error';
    showToast(msg, 'error', 5000);
  } catch (_) { /* noop */ }
});

// Tooltip directive
let __tooltipVm
app.directive('tooltip', {
  async mounted(el, binding) {
    if (!__tooltipVm) {
      const mount = document.createElement('div'); document.body.appendChild(mount)
      const mod = await import('@/components/ui/Tooltip.vue'); const Tooltip = mod.default
      const tApp = createApp(Tooltip); __tooltipVm = tApp.mount(mount)
    }
    const text = binding.value
    const enter = (e)=> __tooltipVm.show(text, { x: e.clientX + 12, y: e.clientY + 12 })
    const leave = ()=> __tooltipVm.hide()
    el.__ttEnter__ = enter; el.__ttLeave__ = leave
    el.addEventListener('mouseenter', enter); el.addEventListener('mouseleave', leave)
    el.addEventListener('focus', enter); el.addEventListener('blur', leave)
  },
  unmounted(el){ el.removeEventListener('mouseenter', el.__ttEnter__); el.removeEventListener('mouseleave', el.__ttLeave__); el.removeEventListener('focus', el.__ttEnter__); el.removeEventListener('blur', el.__ttLeave__) }
})

router.isReady().then(async () => {
  await Promise.all([
    Promise.resolve(workspaceStore.hydrate?.()),
    Promise.resolve(agentStore.hydrate?.()),
    Promise.resolve(knowledgeStore.hydrate?.()),
    Promise.resolve(billingStore.hydrate?.()),
  ])
  if (isE2E) {
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        regs.forEach((r) => r.unregister())
      } catch {}
    }
    document.documentElement.classList.add('e2e-mode')
    window.__E2E_READY__ = true
    document.documentElement.setAttribute('data-test-ready', '1')
    window.__stores = { chatStore, draftStore, presenceStore }
  }
})


// ensure workspace store initializes and persists
void workspaceStore
// hydrate account plan state
void accountStore
// cross-tab logout synchronisation
initLogoutListener()
