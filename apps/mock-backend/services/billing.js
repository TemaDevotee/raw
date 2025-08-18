import { nanoid } from 'nanoid';

export const PLANS = {
  free: { id: 'free', name: 'Free', includedMonthlyTokens: 20000, storageLimitBytes: 50 * 1024 * 1024 },
  pro: { id: 'pro', name: 'Pro', includedMonthlyTokens: 500000, storageLimitBytes: 500 * 1024 * 1024 },
  business: { id: 'business', name: 'Business', includedMonthlyTokens: 3000000, storageLimitBytes: 5000 * 1024 * 1024 },
};

export function estimateTokens(text = '') {
  return Math.ceil(text.length / 4);
}

export function ensureReset(tenant) {
  const now = Date.now();
  const THIRTY_D = 30 * 24 * 60 * 60 * 1000;
  tenant.billing = tenant.billing || { plan: PLANS.free, tokenBalance: PLANS.free.includedMonthlyTokens, cycleResetAt: now };
  if (now > tenant.billing.cycleResetAt + THIRTY_D) {
    tenant.billing.tokenBalance = tenant.billing.plan.includedMonthlyTokens;
    tenant.billing.topUpTokens = 0;
    tenant.billing.cycleResetAt = now;
  }
}

export function chargeMessage(tenant, { chatId, agentId, messageId, role, text, draft }) {
  ensureReset(tenant);
  if (role !== 'agent') return { ok: true, tokens: 0 };
  const tokens = estimateTokens(text);
  if (tenant.billing.tokenBalance < tokens) {
    return {
      ok: false,
      code: 'TOKEN_BALANCE_EXCEEDED',
      needed: tokens,
      balance: tenant.billing.tokenBalance,
    };
  }
  tenant.billing.tokenBalance -= tokens;
  tenant.spendLogs = tenant.spendLogs || [];
  tenant.spendLogs.push({
    id: nanoid(),
    ts: Date.now(),
    tenantId: tenant.id,
    chatId,
    agentId,
    messageId,
    role: 'agent',
    tokens,
    note: draft ? 'draft' : 'sent',
  });
  return { ok: true, tokens };
}

export function adjustTokens(tenant, delta, reason) {
  ensureReset(tenant);
  tenant.billing.tokenBalance = Math.max(0, tenant.billing.tokenBalance + delta);
  tenant.spendLogs = tenant.spendLogs || [];
  tenant.spendLogs.push({
    id: nanoid(),
    ts: Date.now(),
    tenantId: tenant.id,
    role: 'system',
    tokens: Math.abs(delta),
    note: `adjust ${reason || ''} (${delta})`,
  });
  return tenant.billing.tokenBalance;
}
