import Papa from 'papaparse'

export interface ParseOptions {
  header?: boolean
  dynamicTyping?: boolean
  skipEmptyLines?: boolean
}

const DEFAULT_OPTIONS: ParseOptions = {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
}

function trimObjectValues<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  const result = { ...obj } as Record<string, unknown>
  for (const key of Object.keys(result)) {
    const value = result[key]
    if (typeof value === 'string') {
      result[key] = value.trim()
    }
  }
  return result as T
}

export function parseCSV<T>(csvString: string, options: ParseOptions = {}): T[] {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
  const result = Papa.parse<T>(csvString, mergedOptions)
  // Only log actual errors, not delimiter detection warnings for single-column CSVs
  const realErrors = result.errors.filter(e => e.code !== 'UndetectableDelimiter')
  if (realErrors.length > 0) {
    console.warn('CSV parse warnings:', realErrors)
  }
  return result.data.map(row => trimObjectValues(row))
}

export async function fetchCSV<T>(url: string, options: ParseOptions = {}): Promise<T[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  const csvString = await response.text()
  return parseCSV<T>(csvString, options)
}

export async function fetchCSVWithFallback<T>(
  paths: string[],
  options: ParseOptions = {}
): Promise<T[]> {
  let lastError: Error | null = null

  for (const path of paths) {
    try {
      return await fetchCSV<T>(path, options)
    } catch (error) {
      lastError = error as Error
      // Silent fallback - no console output for expected path failures
    }
  }

  throw lastError || new Error('All paths failed')
}
