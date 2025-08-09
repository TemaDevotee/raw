import { describe, it, expect, vi } from 'vitest'
function mockStorage() {
  let store = {}
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v)
    },
    removeItem: (k) => {
      delete store[k]
    },
    clear: () => {
      store = {}
    },
  }
}
global.localStorage = mockStorage()
global.sessionStorage = mockStorage()

import fs from 'fs'
import path from 'path'

vi.mock('@/stores/langStore', () => ({ default: { t: (k) => k } }))

describe('QuotaBar component', () => {
  it('exports component', async () => {
    const mod = await import('@/components/QuotaBar.vue')
    expect(mod.default).toBeTruthy()
  })
  it('contains status classes', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../components/QuotaBar.vue'), 'utf8')
    expect(src).toMatch('quota-bar')
    expect(src).toMatch('warn')
    expect(src).toMatch('danger')
  })
})

describe('ChatWindow token markup', () => {
  it('has composer estimate and token badge', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../ChatWindow.vue'), 'utf8')
    expect(src).toMatch('composer-estimate')
    expect(src).toMatch('TokenBadge')
  })
})
