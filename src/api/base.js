export function resolveApiBase() {
  // 1) explicit override from tests
  const injected = globalThis.__TEST_API_BASE__;
  if (typeof injected === 'string' && injected) return injected;

  // 2) vite/env
  // eslint-disable-next-line no-undef
  const env = (import.meta && import.meta.env) ? import.meta.env : {};
  if (env.VITE_API_BASE) return env.VITE_API_BASE;

  // 3) browser
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }

  // 4) safe default for node tests
  return 'http://localhost';
}
