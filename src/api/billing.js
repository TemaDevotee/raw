import api from '@/shared/http/api';

export async function getBilling() {
  const { data } = await api.get('/account/billing');
  return data;
}

// Mock helpers for usage tracking
export async function recordUsage() {
  return {};
}

export async function aggregateUsage() {
  return {};
}

