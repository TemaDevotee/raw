import { vi } from 'vitest'

// matchMedia stub
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// scrollTo stub
Object.defineProperty(window, 'scrollTo', { writable: true, value: vi.fn() })

// IntersectionObserver stub
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
})

// navigator stubs
Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true })
Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'en-US' })
Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: {
    writeText: vi.fn(),
    readText: vi.fn(),
  },
})
