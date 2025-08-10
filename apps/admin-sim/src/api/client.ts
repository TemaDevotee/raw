export type Billing = {
  plan: 'Free' | 'Pro' | 'Team';
  tokenQuota: number;
  tokenUsed: number;
  period: { start: string; end: string };
};

export type TenantSummary = {
  id: string;
  name: string;
  billing: Billing;
};

export type TenantDetails = TenantSummary & {
  workspacesCount: number;
  agentsCount: number;
  knowledgeCount: number;
  chatsCount: number;
};

export type Paged<T> = { items: T[]; page: number; limit: number; total: number };

const BASE = import.meta.env.VITE_ADMIN_BASE || '';
const KEY = import.meta.env.VITE_ADMIN_KEY || '';

function buildUrl(path: string, params: Record<string, any> = {}) {
  const url = new URL(path, BASE);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, String(v));
  });
  return url.toString();
}

async function request(path: string, params?: Record<string, any>) {
  const res = await fetch(buildUrl(path, params), {
    headers: { 'X-Admin-Key': KEY }
  });
  if (res.status === 401) throw new Error('unauthorized');
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('failed');
  return res.json();
}

export function getTenants(params?: { q?: string; page?: number; limit?: number }) {
  return request('/tenants', params) as Promise<Paged<TenantSummary>>;
}

export function getTenantById(id: string) {
  return request(`/tenants/${id}`) as Promise<TenantDetails | null>;
}
