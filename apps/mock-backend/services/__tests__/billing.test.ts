import { describe, it, expect } from 'vitest';
import { estimateTokens, chargeMessage, adjustTokens, PLANS } from '../billing.js';

describe('billing helpers', () => {
  it('estimates tokens', () => {
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcdefgh')).toBe(2);
  });

  it('charges and logs spend', () => {
    const tenant: any = { id: 't1', billing: { plan: PLANS.free, tokenBalance: 10, cycleResetAt: Date.now() }, spendLogs: [] };
    const res = chargeMessage(tenant, { chatId: 'c1', agentId: 'a1', messageId: 'm1', role: 'agent', text: 'hello world', draft: false });
    expect(res.ok).toBe(true);
    expect(tenant.billing.tokenBalance).toBeLessThan(10);
    expect(tenant.spendLogs.length).toBe(1);
  });

  it('blocks when balance low', () => {
    const tenant: any = { id: 't1', billing: { plan: PLANS.free, tokenBalance: 1, cycleResetAt: Date.now() }, spendLogs: [] };
    const res = chargeMessage(tenant, { chatId: 'c1', agentId: 'a1', messageId: 'm1', role: 'agent', text: 'hello world', draft: false });
    expect(res.ok).toBe(false);
    expect(tenant.spendLogs.length).toBe(0);
  });

  it('adjusts tokens', () => {
    const tenant: any = { id: 't1', billing: { plan: PLANS.free, tokenBalance: 5, cycleResetAt: Date.now() }, spendLogs: [] };
    adjustTokens(tenant, 10, 'bonus');
    expect(tenant.billing.tokenBalance).toBe(15);
    adjustTokens(tenant, -20, 'deduct');
    expect(tenant.billing.tokenBalance).toBe(0);
  });
});
