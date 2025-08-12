import { resolveApiBase } from '../base.js'
import { expect, it } from 'vitest'

it('prefers injected __TEST_API_BASE__', () => {
  globalThis.__TEST_API_BASE__ = 'http://t.local:9999'
  expect(resolveApiBase()).toBe('http://t.local:9999')
  globalThis.__TEST_API_BASE__ = undefined
})

it('falls back to VITE_API_BASE', () => {
  globalThis.__TEST_API_BASE__ = undefined
  const prev = import.meta.env.VITE_API_BASE
  import.meta.env.VITE_API_BASE = 'http://env.local'
  expect(resolveApiBase()).toBe('http://env.local')
  import.meta.env.VITE_API_BASE = prev
})

