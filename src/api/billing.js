export async function getBilling() {
  const res = await fetch('/api/account/billing');
  if (!res.ok) throw new Error('billing.fetchFailed');
  return res.json();
}

