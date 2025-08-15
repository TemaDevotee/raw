import { describe, it, expect, afterEach } from 'vitest'
const { getProvider } = require('../agent/provider-registry')

afterEach(() => {
  delete process.env.OPENAI_API_KEY
})

describe('provider registry', () => {
  it('returns mock when openai key missing', () => {
    const p = getProvider('openai')
    expect(p.name).toBe('mock')
  })
  it('returns openai when key present', () => {
    process.env.OPENAI_API_KEY = 'test'
    const p = getProvider('openai')
    expect(p.name).toBe('openai')
  })
})
