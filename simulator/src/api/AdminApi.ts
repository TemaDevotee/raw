const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function qs(params: Record<string, any> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) search.append(k, String(v));
  });
  return search.toString();
}

export async function getPlans() {
  const res = await fetch(`${API_BASE}/admin/plans`);
  return res.json();
}

export async function getUsers(params: Record<string, any> = {}) {
  const res = await fetch(`${API_BASE}/admin/users?${qs(params)}`);
  return res.json();
}

export async function getUser(id: string) {
  const res = await fetch(`${API_BASE}/admin/users/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getUserWorkspaces(id: string) {
  const res = await fetch(`${API_BASE}/admin/users/${id}/workspaces`);
  if (!res.ok) return [];
  return res.json();
}

export async function getUserAgents(id: string) {
  const res = await fetch(`${API_BASE}/admin/users/${id}/agents`);
  if (!res.ok) return [];
  return res.json();
}

export async function getUserKnowledge(id: string) {
  const res = await fetch(`${API_BASE}/admin/users/${id}/knowledge`);
  if (!res.ok) return [];
  return res.json();
}

export async function getUserChats(id: string) {
  const res = await fetch(`${API_BASE}/admin/users/${id}/chats`);
  if (!res.ok) return [];
  return res.json();
}
