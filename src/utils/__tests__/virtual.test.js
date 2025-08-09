import { describe, it, expect } from 'vitest'
import { computeWindow } from '../virtual.js'

describe('computeWindow', () => {
  it('calculates start and end indices', () => {
    const { start, end } = computeWindow(100, 20, 100, 0, 0)
    expect(start).toBe(0)
    expect(end).toBe(5)
  })
})
