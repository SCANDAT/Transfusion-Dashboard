import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseCSV, fetchCSV, fetchCSVWithFallback } from '../csvParser'

describe('parseCSV', () => {
  it('parses simple CSV with headers', () => {
    const csv = 'name,age,city\nAlice,30,NYC\nBob,25,LA'
    const result = parseCSV<{ name: string; age: number; city: string }>(csv)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'Alice', age: 30, city: 'NYC' })
    expect(result[1]).toEqual({ name: 'Bob', age: 25, city: 'LA' })
  })

  it('applies dynamic typing', () => {
    const csv = 'value,flag\n42,true\n3.14,false'
    const result = parseCSV<{ value: number; flag: boolean }>(csv)

    expect(result[0]?.value).toBe(42)
    expect(result[0]?.flag).toBe(true)
    expect(result[1]?.value).toBe(3.14)
    expect(result[1]?.flag).toBe(false)
  })

  it('skips empty lines', () => {
    const csv = 'col\na\n\nb\n\n'
    const result = parseCSV<{ col: string }>(csv)

    expect(result).toHaveLength(2)
  })

  it('handles quoted values with commas', () => {
    const csv = 'name,description\n"Doe, John","A person"'
    const result = parseCSV<{ name: string; description: string }>(csv)

    expect(result[0]?.name).toBe('Doe, John')
  })

  it('allows disabling dynamic typing', () => {
    const csv = 'value\n42'
    const result = parseCSV<{ value: string }>(csv, { dynamicTyping: false })

    expect(result[0]?.value).toBe('42')
    expect(typeof result[0]?.value).toBe('string')
  })
})

describe('fetchCSV', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches and parses CSV from URL', async () => {
    const mockCSV = 'id,name\n1,Test'
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockCSV),
    })

    const result = await fetchCSV<{ id: number; name: string }>('/test.csv')

    expect(fetch).toHaveBeenCalledWith('/test.csv')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ id: 1, name: 'Test' })
  })

  it('throws on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    await expect(fetchCSV('/missing.csv')).rejects.toThrow('404')
  })

  it('throws on network error', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(fetchCSV('/test.csv')).rejects.toThrow('Network error')
  })
})

describe('fetchCSVWithFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses first path when it succeeds', async () => {
    const mockCSV = 'col\nvalue'
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockCSV),
    })

    const result = await fetchCSVWithFallback<{ col: string }>(['/path1.csv', '/path2.csv'])

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('/path1.csv')
    expect(result).toHaveLength(1)
  })

  it('falls back to second path when first fails', async () => {
    const mockCSV = 'col\nvalue'
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockCSV),
      })

    const result = await fetchCSVWithFallback<{ col: string }>(['/path1.csv', '/path2.csv'])

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenNthCalledWith(1, '/path1.csv')
    expect(fetch).toHaveBeenNthCalledWith(2, '/path2.csv')
    expect(result).toHaveLength(1)
  })

  it('throws when all paths fail', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 })

    await expect(
      fetchCSVWithFallback(['/path1.csv', '/path2.csv'])
    ).rejects.toThrow()
  })
})
