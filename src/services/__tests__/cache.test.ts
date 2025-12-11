import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DataCache } from '../cache'

describe('DataCache', () => {
  let cache: DataCache

  beforeEach(() => {
    cache = new DataCache(5) // 5 minute TTL
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('get/set', () => {
    it('returns null for missing keys', () => {
      expect(cache.get('nonexistent')).toBeNull()
    })

    it('stores and retrieves data', () => {
      cache.set('test', { foo: 'bar' })
      expect(cache.get('test')).toEqual({ foo: 'bar' })
    })

    it('stores complex data structures', () => {
      const data = {
        rows: [{ id: 1, value: 'a' }, { id: 2, value: 'b' }],
        metadata: { count: 2 },
      }
      cache.set('complex', data)
      expect(cache.get('complex')).toEqual(data)
    })

    it('overwrites existing keys', () => {
      cache.set('test', 'first')
      cache.set('test', 'second')
      expect(cache.get('test')).toBe('second')
    })
  })

  describe('TTL expiration', () => {
    it('returns data before TTL expires', () => {
      cache.set('test', 'value', 1) // 1 minute TTL

      vi.advanceTimersByTime(30 * 1000) // 30 seconds
      expect(cache.get('test')).toBe('value')
    })

    it('returns null after TTL expires', () => {
      cache.set('test', 'value', 1) // 1 minute TTL

      vi.advanceTimersByTime(61 * 1000) // 61 seconds
      expect(cache.get('test')).toBeNull()
    })

    it('uses default TTL when not specified', () => {
      cache.set('test', 'value') // Uses 5 minute default

      vi.advanceTimersByTime(4 * 60 * 1000) // 4 minutes
      expect(cache.get('test')).toBe('value')

      vi.advanceTimersByTime(2 * 60 * 1000) // 2 more minutes (total 6)
      expect(cache.get('test')).toBeNull()
    })

    it('allows custom TTL per entry', () => {
      cache.set('short', 'value', 1)  // 1 minute
      cache.set('long', 'value', 10)  // 10 minutes

      vi.advanceTimersByTime(5 * 60 * 1000) // 5 minutes

      expect(cache.get('short')).toBeNull()
      expect(cache.get('long')).toBe('value')
    })
  })

  describe('has', () => {
    it('returns false for missing keys', () => {
      expect(cache.has('nonexistent')).toBe(false)
    })

    it('returns true for existing valid keys', () => {
      cache.set('test', 'value')
      expect(cache.has('test')).toBe(true)
    })

    it('returns false for expired keys', () => {
      cache.set('test', 'value', 1)
      vi.advanceTimersByTime(61 * 1000)
      expect(cache.has('test')).toBe(false)
    })
  })

  describe('delete', () => {
    it('removes existing keys', () => {
      cache.set('test', 'value')
      cache.delete('test')
      expect(cache.get('test')).toBeNull()
    })

    it('returns true when key existed', () => {
      cache.set('test', 'value')
      expect(cache.delete('test')).toBe(true)
    })

    it('returns false when key did not exist', () => {
      expect(cache.delete('nonexistent')).toBe(false)
    })
  })

  describe('clear', () => {
    it('removes all entries', () => {
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      cache.clear()

      expect(cache.get('a')).toBeNull()
      expect(cache.get('b')).toBeNull()
      expect(cache.get('c')).toBeNull()
    })
  })

  describe('stats', () => {
    it('returns correct size', () => {
      expect(cache.stats().size).toBe(0)

      cache.set('a', 1)
      cache.set('b', 2)

      expect(cache.stats().size).toBe(2)
    })

    it('returns all keys', () => {
      cache.set('a', 1)
      cache.set('b', 2)

      const { keys } = cache.stats()
      expect(keys).toContain('a')
      expect(keys).toContain('b')
    })

    it('excludes expired entries from stats', () => {
      cache.set('short', 'value', 1)
      cache.set('long', 'value', 10)

      vi.advanceTimersByTime(5 * 60 * 1000)

      const { size, keys } = cache.stats()
      expect(size).toBe(1)
      expect(keys).toContain('long')
      expect(keys).not.toContain('short')
    })
  })
})
