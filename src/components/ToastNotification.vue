<template>
  <!-- Toast container placed at the top right of the viewport -->
  <!-- Use aria-live to politely announce notifications to screen readers and
       role="status" to ensure they are conveyed as status messages.  Without
       these attributes assistive technologies may never announce toasts. -->
  <div
    class="fixed top-4 right-4 z-50 space-y-2"
    role="status"
    aria-live="polite"
  >
    <transition-group
      name="toast"
      tag="div"
      enter-active-class="transition transform duration-300"
      leave-active-class="transition transform duration-300"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="toast.type === 'error' ? 'toast-error' : 'toast-success'"
      >
        <span class="material-icons-outlined mr-2">
          {{ toast.type === 'error' ? 'error' : 'check_circle' }}
        </span>
        <span>{{ toast.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import toastStore from '@/stores/toastStore.js'
// Reactive array of toasts
const toasts = toastStore.toasts
</script>

<style scoped>
.toast-item {
  display: flex;
  align-items: center;
  max-width: 20rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background-color: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  color: var(--c-text-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.toast-success {
  border-left: 4px solid #16a34a; /* green */
}
.toast-error {
  border-left: 4px solid #dc2626; /* red */
}
.material-icons-outlined {
  font-size: 1.25rem;
}
</style>
