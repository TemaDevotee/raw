import { reactive } from 'vue';

export type Toast = { id: number; message: string; type: 'success' | 'error' };
export const toasts = reactive<Toast[]>([]);
let counter = 0;
export function showToast(message: string, type: 'success' | 'error' = 'success', duration = 2000) {
  const id = ++counter;
  toasts.push({ id, message, type });
  setTimeout(() => {
    const idx = toasts.findIndex(t => t.id === id);
    if (idx !== -1) toasts.splice(idx, 1);
  }, duration);
}
