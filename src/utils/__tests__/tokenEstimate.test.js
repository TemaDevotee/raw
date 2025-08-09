import { describe, it, expect } from 'vitest'
import { estimateTokensForText, estimateForMessage } from '../tokenEstimate.js'

describe('tokenEstimate', () => {
  it('returns 0 for empty', () => {
    expect(estimateTokensForText('')).toBe(0)
  })
  it('estimates ascii text', () => {
    expect(estimateTokensForText('hello world')).toBeGreaterThan(0)
  })
  it('unicode wider than ascii', () => {
    const ascii = estimateTokensForText('aaaa')
    const uni = estimateTokensForText('аааа')
    expect(uni).toBeGreaterThanOrEqual(ascii)
  })
  it('estimateForMessage sums fields', () => {
    const res = estimateForMessage({ system: 'hi', prompt: 'there' })
    expect(res).toBe(
      estimateTokensForText('hi') + estimateTokensForText('there')
    )
  })
})
