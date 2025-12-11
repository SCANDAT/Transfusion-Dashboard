interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class DataCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private defaultTTL: number

  constructor(defaultTTLMinutes = 5) {
    this.defaultTTL = defaultTTLMinutes * 60 * 1000
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null
    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : this.defaultTTL
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  stats(): { size: number; keys: string[] } {
    // Clean expired entries before returning stats
    const validKeys: string[] = []
    for (const key of this.cache.keys()) {
      if (this.has(key)) {
        validKeys.push(key)
      }
    }
    return {
      size: validKeys.length,
      keys: validKeys,
    }
  }
}

export const dataCache = new DataCache(5)
