import { reactive } from 'vue';

export function createPinia() {
  return {};
}

export function defineStore(id: string, options: any) {
  return function useStore() {
    const state = reactive(options.state());
    const store: any = state;
    if (options.actions) {
      for (const [k, fn] of Object.entries(options.actions)) {
        store[k] = (fn as Function).bind(store);
      }
    }
    if (options.getters) {
      for (const [k, fn] of Object.entries(options.getters)) {
        Object.defineProperty(store, k, { get: () => (fn as Function)(store) });
      }
    }
    return store;
  };
}
