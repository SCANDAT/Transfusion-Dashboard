import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CSVParseError, parseCSV, fetchCSV, fetchCSVWithFallback } from '../csvParser'
function toBytes(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer as ArrayBuffer
}


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
      arrayBuffer: () => Promise.resolve(toBytes(mockCSV)),
    })

    const result = await fetchCSV<{ id: number; name: string }>('/test.csv')

    expect(fetch).toHaveBeenCalledWith('/test.csv', { cache: 'no-store' })
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
      arrayBuffer: () => Promise.resolve(toBytes(mockCSV)),
    })

    const result = await fetchCSVWithFallback<{ col: string }>(['/path1.csv', '/path2.csv'])

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('/path1.csv', { cache: 'no-store' })
    expect(result).toHaveLength(1)
  })

  it('falls back to second path when first fails', async () => {
    const mockCSV = 'col\nvalue'
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockCSV)),
      })

    const result = await fetchCSVWithFallback<{ col: string }>(['/path1.csv', '/path2.csv'])

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenNthCalledWith(1, '/path1.csv', { cache: 'no-store' })
    expect(fetch).toHaveBeenNthCalledWith(2, '/path2.csv', { cache: 'no-store' })
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


describe('scientific CSV integrity', () => {
  it.each([
    '',
    'time,estimate\n',
    'time,estimate\n0',
    'time,estimate\n0,2,3',
    'time,estimate\n0,"unterminated',
    'estimate,estimate\n1,2',
    'estimate, estimate \n1,2',
    ',estimate\n0,2',
    '<!DOCTYPE html><html><body>Not found</body></html>',
  ])('rejects malformed input rather than displaying partial rows', csv => {
    expect(() => parseCSV(csv)).toThrow(CSVParseError)
  })

  it('does not include field values in parse errors or logs', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const input = 'time,estimate\n0,2,private-test-value'
    try {
      parseCSV(input)
      expect.unreachable('Malformed input must fail')
    } catch (error) {
      expect(String(error)).not.toContain('private-test-value')
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('preserves zero and quoted fields while trimming column names', () => {
    expect(parseCSV(' time , estimate ,label\n0,0,"a, b"')).toEqual([
      { time: 0, estimate: 0, label: 'a, b' },
    ])
  })

  it('preserves arrays when headers are disabled', () => {
    expect(parseCSV('0,  label ', { header: false })).toEqual([[0, 'label']])
  })

  it('rejects a successful HTTP response with HTML content type', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'Content-Type': 'text/html; charset=utf-8' }),
      arrayBuffer: () => Promise.resolve(toBytes('server error')),
    })
    await expect(fetchCSV('/data.csv')).rejects.toThrow(CSVParseError)
  })

  it('does not mask malformed primary data with a fallback file', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(toBytes('time,estimate\n0,2,3')),
    })
    await expect(fetchCSVWithFallback(['/first.csv', '/second.csv'])).rejects.toThrow(CSVParseError)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})


describe('CSV byte decoding', () => {
  it('preserves UTF-8 Swedish characters', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true, arrayBuffer: async () => toBytes('label\nHj\u00e4rtfrekv') })
    await expect(fetchCSV('/data.csv')).resolves.toEqual([{ label: 'Hj\u00e4rtfrekv' }])
  })

  it('decodes Windows-1252 only when explicitly configured', async () => {
    const bytes = Uint8Array.from('label\nHj\u00e4rtfrekv', character => character.charCodeAt(0)).buffer
    global.fetch = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => bytes })
    await expect(fetchCSV('/legacy.csv')).rejects.toThrow('could not be decoded as utf-8')
    await expect(fetchCSV('/legacy.csv', { encoding: 'windows-1252' })).resolves.toEqual([{ label: 'Hj\u00e4rtfrekv' }])
  })

  it.each(['label\n\uFFFD', 'label\n\u0000', 'label\n\u0081'])('rejects replacement or control characters', csv => {
    expect(() => parseCSV(csv)).toThrow('invalid or undecoded characters')
  })

  it('does not mask a server error with a filename fallback', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    await expect(fetchCSVWithFallback(['/upper.csv', '/lower.csv'])).rejects.toThrow('HTTP 500')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not mask a network error with a filename fallback', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection failed'))
    await expect(fetchCSVWithFallback(['/upper.csv', '/lower.csv'])).rejects.toThrow('Connection failed')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
