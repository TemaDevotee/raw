export const AUTH_KEY = 'auth:session';

export function isAuthed(): boolean {
  try {
    return !!JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch {
    return false;
  }
}

export function setDevAuth() {
  const v = { user: 'dev', role: 'user', ts: Date.now() };
  localStorage.setItem(AUTH_KEY, JSON.stringify(v));
}

export function ensureAuthFromQuery(): boolean {
  const sp = new URLSearchParams(location.search);
  const fromQuery = sp.get('skipAuth') === '1';
  const fromFlag = sessionStorage.getItem('skipAuth') === '1';
  if (fromQuery || fromFlag) {
    setDevAuth();
    sessionStorage.removeItem('skipAuth');
    if (fromQuery) {
      const url = new URL(location.href);
      url.searchParams.delete('skipAuth');
      history.replaceState({}, '', url);
    }
    return true;
  }
  return false;
}
