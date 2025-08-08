import './main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { showToast } from '@/stores/toastStore'
import { workspaceStore } from '@/stores/workspaceStore'

const app = createApp(App)

app.use(router)

// Global error handling to prevent white-screen on runtime errors
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue error]', err, info);
  try { showToast(err?.message || 'Unexpected error', 'error', 5000); } catch (_) {}
};
window.addEventListener('error', (e) => {
  console.error('[Window error]', e.error || e);
  try { showToast(e?.message || 'Unexpected error', 'error', 5000); } catch (_) {}
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled rejection]', e.reason || e);
  try { 
    const msg = (e?.reason && (e.reason.message || e.reason.toString())) || 'Unexpected async error';
    showToast(msg, 'error', 5000); 
  } catch (_) {}
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
if (location.pathname !== '/login.html') { app.mount('#app') }


// ensure workspace store initializes and persists
void workspaceStore
