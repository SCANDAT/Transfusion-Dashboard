import Papa from 'papaparse'

export interface ParseOptions {
  header?: boolean
  dynamicTyping?: boolean
  skipEmptyLines?: boolean
}

export interface FetchOptions extends ParseOptions {
  // Only verified legacy exports may opt out of strict UTF-8 decoding.
  encoding?: 'utf-8' | 'windows-1252'
}

export class CSVFetchError extends Error {
  constructor(public readonly status: number) {
    super(`Failed to fetch CSV: HTTP ${status}`)
    this.name = 'CSVFetchError'
  }
}

const DEFAULT_OPTIONS: ParseOptions = {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
}

export class CSVParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CSVParseError'
  }
}

function trimObjectValues<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(value => typeof value === 'string' ? value.trim() : value) as T
  }
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
  // eslint-disable-next-line no-control-regex -- Reject undecoded text and binary/control bytes in result CSVs.
  if (/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(csvString)) {
    throw new CSVParseError('CSV contains invalid or undecoded characters.')
  }
  if (/^\s*<(?:!doctype\s+html|html|head|body)(?:\s|>)/i.test(csvString)) {
    throw new CSVParseError('Expected CSV data; received an HTML page.')
  }

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
  const result = Papa.parse<T>(csvString, {
    ...mergedOptions,
    transformHeader: header => header.trim(),
  })
  // A one-column CSV has no delimiter to detect. Other errors must not pass
  // malformed or misaligned scientific values through to the dashboard.
  const realErrors = result.errors.filter(e => e.code !== 'UndetectableDelimiter')
  if (realErrors.length > 0) {
    const codes = [...new Set(realErrors.map(error => error.code))].join(', ')
    throw new CSVParseError(`Invalid CSV (${codes}).`)
  }

  const fields = result.meta.fields ?? []
  const renamedHeaders = (result.meta as Papa.ParseMeta & { renamedHeaders?: Record<string, string> | null }).renamedHeaders
  if ((renamedHeaders && Object.keys(renamedHeaders).length > 0) ||
      fields.some(field => !field) || new Set(fields).size !== fields.length) {
    throw new CSVParseError('CSV column names must be nonempty and unique.')
  }
  if (result.data.length === 0) {
    throw new CSVParseError('CSV contains no data rows.')
  }
  return result.data.map(row => trimObjectValues(row))
}

export async function fetchCSV<T>(url: string, options: FetchOptions = {}): Promise<T[]> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new CSVFetchError(response.status)
  }
  if (response.headers?.get('content-type')?.toLowerCase().includes('text/html')) {
    throw new CSVParseError('Expected CSV data; received an HTML page.')
  }
  const { encoding = 'utf-8', ...parseOptions } = options
  const bytes = await response.arrayBuffer()
  let csvString: string
  try {
    csvString = new TextDecoder(encoding, { fatal: true }).decode(bytes)
  } catch {
    throw new CSVParseError(`CSV could not be decoded as ${encoding}.`)
  }
  return parseCSV<T>(csvString, parseOptions)
}

export async function fetchCSVWithFallback<T>(
  paths: string[],
  options: FetchOptions = {}
): Promise<T[]> {
  let lastError: Error | null = null

  for (const path of paths) {
    try {
      return await fetchCSV<T>(path, options)
    } catch (error) {
      // Filename aliases only address missing files, never invalid data,
      // failed requests or server errors.
      if (!(error instanceof CSVFetchError) || error.status !== 404) throw error
      lastError = error
    }
  }

  throw lastError || new Error('All paths failed')
}
