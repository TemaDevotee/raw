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
export type LedgerEntry = {
  id: string;
  ts: string;
  type: string;
  amount?: number;
  from?: string;
  to?: string;
  by: string;
  note?: string;
};

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

async function post(path: string, body?: any) {
  const res = await fetch(new URL(path, BASE), {
    method: 'POST',
    headers: { 'X-Admin-Key': KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new Error('unauthorized');
  if (!res.ok) throw new Error('failed');
  return res.json();
}

export function getTenants(params?: { q?: string; page?: number; limit?: number }) {
  return request('/tenants', params) as Promise<Paged<TenantSummary>>;
}

export function getTenantById(id: string) {
  return request(`/tenants/${id}`) as Promise<TenantDetails | null>;
}

export function postPlan(id: string, plan: string) {
  return post(`/tenants/${id}/billing/plan`, { plan });
}

export function postQuota(id: string, quota: number) {
  return post(`/tenants/${id}/billing/quota`, { quota });
}

export function postCredit(id: string, amount: number, note?: string) {
  return post(`/tenants/${id}/billing/credit`, { amount, note });
}

export function postDebit(id: string, amount: number, note?: string) {
  return post(`/tenants/${id}/billing/debit`, { amount, note });
}

export function postReset(id: string, start?: string, end?: string) {
  return post(`/tenants/${id}/billing/reset-period`, { start, end });
}

export function getLedger(id: string, params?: { limit?: number; cursor?: number }) {
  return request(`/tenants/${id}/billing/ledger`, params) as Promise<{ items: LedgerEntry[]; nextCursor: number | null }>;
}
