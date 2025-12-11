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

/**
 * Helper to trim string values in an object
 */
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
  if (result.errors.length > 0) {
    console.warn('CSV parse warnings:', result.errors)
  }
  // Trim all string values to handle CSV files with trailing spaces
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

/**
 * Fetch CSV with fallback paths
 * Tries primary path first, then fallback paths in order
 */
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
      console.debug(`Failed to load ${path}, trying next...`)
    }
  }

  throw lastError || new Error('All paths failed')
}
