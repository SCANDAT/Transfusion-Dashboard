import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})

// Mock window.matchMedia for theme tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock requestIdleCallback
window.requestIdleCallback = vi.fn((cb) => {
  const start = Date.now()
  return setTimeout(() => {
    cb({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    })
  }, 1) as unknown as number
})

window.cancelIdleCallback = vi.fn((id) => clearTimeout(id))
