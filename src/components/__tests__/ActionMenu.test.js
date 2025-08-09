import { describe, it, expect, vi } from 'vitest'
vi.mock('@/stores/langStore', () => ({ default: { t: (k) => k } }))
const ActionMenu = (await import('../ui/ActionMenu.vue')).default

describe('ActionMenu', () => {
  it('exports component', () => {
    expect(ActionMenu).toBeTruthy()
  })
})
