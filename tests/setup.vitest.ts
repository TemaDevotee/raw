import { vi } from 'vitest'

const globalObj = globalThis as any

// minimal window/document so code expecting them doesn't crash
(globalObj as any).window = globalObj

globalObj.document = globalObj.document ?? {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  createElement: vi.fn().mockReturnValue({ style: {} }),
  querySelector: vi.fn().mockReturnValue(null),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    classList: { add: vi.fn(), remove: vi.fn() },
  },
}

// addEventListener/dispatchEvent on global
const __et = new (globalObj.EventTarget || class {
  listeners: Record<string, Function[]> = {}
  addEventListener(type: string, cb: any) {
    ;(this.listeners[type] ||= []).push(cb)
  }
  removeEventListener(type: string, cb: any) {
    if (this.listeners[type]) this.listeners[type] = this.listeners[type].filter((f) => f !== cb)
  }
  dispatchEvent(e: any) {
    ;(this.listeners[e.type] || []).forEach((cb) => cb(e))
    return true
  }
})()
if (!('addEventListener' in globalObj)) globalObj.addEventListener = __et.addEventListener.bind(__et)
if (!('removeEventListener' in globalObj)) globalObj.removeEventListener = __et.removeEventListener.bind(__et)
if (!('dispatchEvent' in globalObj)) globalObj.dispatchEvent = __et.dispatchEvent.bind(__et)

// matchMedia stub
globalObj.matchMedia = globalObj.matchMedia ?? vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// scroll / observers
globalObj.scrollTo = globalObj.scrollTo ?? vi.fn()
globalObj.IntersectionObserver = globalObj.IntersectionObserver ?? class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalObj.ResizeObserver = globalObj.ResizeObserver ?? class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// simple in-memory localStorage
class MemoryStorage {
  store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear() {
    this.store.clear()
  }
  getItem(k: string) {
    return this.store.has(k) ? this.store.get(k)! : null
  }
  key(i: number) {
    return Array.from(this.store.keys())[i] ?? null
  }
  removeItem(k: string) {
    this.store.delete(k)
  }
  setItem(k: string, v: string) {
    this.store.set(k, String(v))
  }
}
if (!('localStorage' in globalObj))
  Object.defineProperty(globalObj, 'localStorage', { value: new MemoryStorage(), writable: true, configurable: true })

// navigator fields
if (!('navigator' in globalObj)) (globalObj as any).navigator = {}
Object.defineProperty(globalObj.navigator, 'onLine', { configurable: true, get: () => true })
Object.defineProperty(globalObj.navigator, 'language', { configurable: true, get: () => 'en-US' })
Object.defineProperty(globalObj.navigator, 'clipboard', {
  configurable: true,
  value: { writeText: vi.fn(), readText: vi.fn() },
})

// fetch stub
if (!globalObj.fetch) globalObj.fetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }))
