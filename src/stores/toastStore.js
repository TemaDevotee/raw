import { reactive } from 'vue'

/**
 * A simple store for managing toast notifications.  Use showToast()
 * to push a new message; it will automatically disappear after a
 * timeout.  Each toast has a unique id, a message and a type
 * ('success' or 'error') to allow styling.
 */
const toasts = reactive([])

let counter = 0

export function showToast (message, type = 'success', duration = 3000) {
  const id = ++counter
  toasts.push({ id, message, type })
  // Remove after timeout
  setTimeout(() => {
    const index = toasts.findIndex(t => t.id === id)
    if (index !== -1) toasts.splice(index, 1)
  }, duration)
}

export default {
  toasts,
  showToast,
}
