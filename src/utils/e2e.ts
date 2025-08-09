export const isE2E =
  (typeof window !== 'undefined' && !!window.localStorage?.getItem('__e2e__')) ||
  import.meta.env.VITE_E2E === 'true'

