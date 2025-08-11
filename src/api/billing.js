export async function getBilling() {
  const res = await fetch('/api/account/billing');
  if (!res.ok) throw new Error('billing.fetchFailed');
  return res.json();
}

// Mock helpers for usage tracking
export async function recordUsage() {
  return {};
}

export async function aggregateUsage() {
  return {};
}

