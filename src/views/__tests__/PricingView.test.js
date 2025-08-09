import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/stores/accountStore', () => {
  const state = {
    plans: [
      { id: 'free', nameKey: 'plan.free', priceText: '$0', periodKey: 'period.month', features: [] },
      { id: 'pro', nameKey: 'plan.pro', priceText: '$10', periodKey: 'period.month', features: [] },
    ],
    currentPlanId: 'free',
  }
  return { default: { state, upgradeTo: vi.fn() } }
})
vi.mock('@/stores/langStore', () => ({ default: { t: (key) => key } }))
vi.mock('@/stores/toastStore', () => ({ showToast: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: () => ({ back: vi.fn(), replace: vi.fn() }) }))

import { usePricing } from '../pricingLogic.js'

describe('Pricing logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not upgrade current plan', async () => {
    const store = (await import('@/stores/accountStore')).default
    const logic = usePricing()
    await logic.choose('free')
    expect(store.upgradeTo).not.toHaveBeenCalled()
  })

  it('calls upgradeTo when selecting other plan', async () => {
    const store = (await import('@/stores/accountStore')).default
    const logic = usePricing()
    await logic.choose('pro')
    expect(store.upgradeTo).toHaveBeenCalledWith('pro')
  })
})
