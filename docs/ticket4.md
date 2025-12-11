# T-004: Data Service Implementation

| Field | Value |
|-------|-------|
| **ID** | T-004 |
| **Title** | Data Service Implementation |
| **Phase** | 2 - Data Layer |
| **Priority** | Critical |
| **Depends On** | T-003 |
| **Blocks** | T-009, T-010, T-011, T-012 |
| **Estimated Effort** | 3-4 hours |

---

## Objective

Create a type-safe data loading service with client-side caching that abstracts all CSV file operations and provides React hooks for data consumption.

---

## Context

The legacy application loads CSV files directly in each module with no caching. This causes:
- Redundant network requests for the same data
- Inconsistent error handling
- No loading state management
- Tight coupling between UI and data layer

The new service will:
- Centralize all data loading
- Cache parsed data with configurable TTL
- Provide typed interfaces for all data structures
- Handle file naming inconsistencies (case sensitivity)
- Expose React hooks for component consumption

---

## Requirements

### 1. CSV Parser Wrapper

**`src/services/csvParser.ts`:**

```typescript
import Papa from 'papaparse'

export interface ParseOptions {
  header?: boolean
  dynamicTyping?: boolean
  skipEmptyLines?: boolean
  transformHeader?: (header: string) => string
}

const DEFAULT_OPTIONS: ParseOptions = {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
}

/**
 * Parse CSV string to typed array
 */
export function parseCSV<T>(
  csvString: string,
  options: ParseOptions = {}
): T[] {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
  
  const result = Papa.parse<T>(csvString, {
    header: mergedOptions.header,
    dynamicTyping: mergedOptions.dynamicTyping,
    skipEmptyLines: mergedOptions.skipEmptyLines,
    transformHeader: mergedOptions.transformHeader,
  })
  
  if (result.errors.length > 0) {
    console.warn('CSV parse warnings:', result.errors)
  }
  
  return result.data
}

/**
 * Fetch and parse CSV from URL
 */
export async function fetchCSV<T>(
  url: string,
  options: ParseOptions = {}
): Promise<T[]> {
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  
  const csvString = await response.text()
  return parseCSV<T>(csvString, options)
}
```

### 2. Cache Implementation

**`src/services/cache.ts`:**

```typescript
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
  
  /**
   * Get cached data if valid
   */
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
  
  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : this.defaultTTL
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }
  
  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }
  
  /**
   * Remove specific key
   */
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
  }
  
  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Singleton instance
export const dataCache = new DataCache(5) // 5-minute default TTL
```

### 3. Main Data Service

**`src/services/dataService.ts`:**

```typescript
import { fetchCSV } from './csvParser'
import { dataCache } from './cache'
import type {
  VitalParamCode,
  CompFactorCode,
  VizIndexEntry,
  VisualizationDataRow,
  TransfusionDataRow,
  LoessDataRow,
  ObservedDataSummaryRow,
  ModelBasedSummaryRow,
  FactorSummaryRow,
  DescriptiveStatistics,
  PatientSexDistribution,
  PatientAgeStats,
  AgeGroupDistribution,
  RbcUnitsPerPatient,
  DonorHbDistribution,
  DonorSexDistribution,
  DonorParityDistribution,
  DonationWeekdayDistribution,
  StorageDistribution,
} from '@/types'

const DATA_BASE_PATH = '/data'

/**
 * Helper: Fetch with cache
 */
async function fetchWithCache<T>(
  cacheKey: string,
  url: string,
  ttlMinutes?: number
): Promise<T[]> {
  // Check cache first
  const cached = dataCache.get<T[]>(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch and parse
  const data = await fetchCSV<T>(url)
  
  // Store in cache
  dataCache.set(cacheKey, data, ttlMinutes)
  
  return data
}

/**
 * Helper: Try multiple file paths (handles case sensitivity)
 */
async function fetchWithFallback<T>(
  cacheKey: string,
  primaryPath: string,
  fallbackPath: string
): Promise<T[]> {
  const cached = dataCache.get<T[]>(cacheKey)
  if (cached) return cached
  
  try {
    return await fetchWithCache<T>(cacheKey, primaryPath)
  } catch {
    return await fetchWithCache<T>(cacheKey, fallbackPath)
  }
}

// ─────────────────────────────────────────────────────────────────
// VISUALIZATION INDEX
// ─────────────────────────────────────────────────────────────────

/**
 * Load the visualization index (maps vital+factor to files)
 */
export async function loadVizIndex(): Promise<VizIndexEntry[]> {
  return fetchWithCache<VizIndexEntry>(
    'viz_index',
    `${DATA_BASE_PATH}/viz_index.csv`
  )
}

/**
 * Get available vital parameters from index
 */
export async function getAvailableVitalParams(): Promise<VitalParamCode[]> {
  const index = await loadVizIndex()
  const vitals = new Set(index.map(row => row.VitalParam as VitalParamCode))
  return Array.from(vitals)
}

/**
 * Get available component factors for a vital parameter
 */
export async function getAvailableCompFactors(
  vitalParam: VitalParamCode
): Promise<CompFactorCode[]> {
  const index = await loadVizIndex()
  const factors = index
    .filter(row => row.VitalParam === vitalParam)
    .map(row => row.CompFactor as CompFactorCode)
  return Array.from(new Set(factors))
}

// ─────────────────────────────────────────────────────────────────
// VISUALIZATION DATA
// ─────────────────────────────────────────────────────────────────

export interface VisualizationData {
  rows: VisualizationDataRow[]
  comparisonColumn: string
  comparisonValues: (string | number)[]
  metadata: {
    vitalParam: VitalParamCode
    compFactor: CompFactorCode
    vitalName: string
    compName: string
    yLabel: string
    deltaYLabel: string
  }
}

/**
 * Load visualization data for a vital + factor combination
 */
export async function loadVisualizationData(
  vitalParam: VitalParamCode,
  compFactor: CompFactorCode
): Promise<VisualizationData> {
  const cacheKey = `viz_${vitalParam}_${compFactor}`
  
  // Check cache for processed data
  const cached = dataCache.get<VisualizationData>(cacheKey)
  if (cached) return cached
  
  // Try uppercase first (legacy convention), then lowercase
  const upperPath = `${DATA_BASE_PATH}/VIZ_${vitalParam}_${compFactor}.csv`
  const lowerPath = `${DATA_BASE_PATH}/viz_${vitalParam.toLowerCase()}_${compFactor.toLowerCase()}.csv`
  
  const rows = await fetchWithFallback<VisualizationDataRow>(
    `${cacheKey}_raw`,
    upperPath,
    lowerPath
  )
  
  // Determine comparison column and unique values
  const comparisonColumn = compFactor
  const comparisonValues = Array.from(
    new Set(rows.map(row => row[comparisonColumn as keyof VisualizationDataRow]))
  ).filter(v => v !== undefined && v !== null)
  
  // Build metadata (would come from VITAL_PARAMS and COMP_FACTORS constants)
  const result: VisualizationData = {
    rows,
    comparisonColumn,
    comparisonValues,
    metadata: {
      vitalParam,
      compFactor,
      vitalName: vitalParam, // Will be enhanced by type constants
      compName: compFactor,
      yLabel: `${vitalParam} Value`,
      deltaYLabel: `Δ ${vitalParam}`,
    },
  }
  
  // Cache processed result
  dataCache.set(cacheKey, result)
  
  return result
}

// ─────────────────────────────────────────────────────────────────
// TRANSFUSION DATA
// ─────────────────────────────────────────────────────────────────

/**
 * Load transfusion effect data for a vital parameter
 */
export async function loadTransfusionData(
  vitalParam: VitalParamCode
): Promise<TransfusionDataRow[]> {
  const cacheKey = `transfusion_${vitalParam}`
  
  const upperPath = `${DATA_BASE_PATH}/VIZ_${vitalParam}_TRANSFUSION.csv`
  const lowerPath = `${DATA_BASE_PATH}/viz_${vitalParam.toLowerCase()}_transfusion.csv`
  
  return fetchWithFallback<TransfusionDataRow>(cacheKey, upperPath, lowerPath)
}

// ─────────────────────────────────────────────────────────────────
// LOESS DATA
// ─────────────────────────────────────────────────────────────────

/**
 * Load LOESS smoothing data
 */
export async function loadLoessData(): Promise<LoessDataRow[]> {
  return fetchWithCache<LoessDataRow>(
    'loess_data',
    `${DATA_BASE_PATH}/VIZ_LOESS.csv`
  )
}

/**
 * Get LOESS data filtered for a specific vital parameter
 */
export async function getLoessDataForVital(
  vitalParam: VitalParamCode
): Promise<LoessDataRow[]> {
  const allLoess = await loadLoessData()
  return allLoess.filter(row => row.VitalParam === vitalParam)
}

// ─────────────────────────────────────────────────────────────────
// SUMMARY TABLES
// ─────────────────────────────────────────────────────────────────

/**
 * Load observed data summary (Table 2a)
 */
export async function loadObservedDataSummary(): Promise<ObservedDataSummaryRow[]> {
  return fetchWithCache<ObservedDataSummaryRow>(
    'observed_summary',
    `${DATA_BASE_PATH}/observed_data_summary.csv`
  )
}

/**
 * Load model-based summary (Table 2a)
 */
export async function loadModelBasedSummary(): Promise<ModelBasedSummaryRow[]> {
  return fetchWithCache<ModelBasedSummaryRow>(
    'model_summary',
    `${DATA_BASE_PATH}/model_based_summary.csv`
  )
}

/**
 * Load factor-specific observed summary (Table 2b)
 */
export async function loadFactorObservedSummary(): Promise<FactorSummaryRow[]> {
  return fetchWithCache<FactorSummaryRow>(
    'factor_observed_summary',
    `${DATA_BASE_PATH}/factor_observed_summary.csv`
  )
}

/**
 * Load factor-specific model summary (Table 2b)
 */
export async function loadFactorModelSummary(): Promise<FactorSummaryRow[]> {
  return fetchWithCache<FactorSummaryRow>(
    'factor_model_summary',
    `${DATA_BASE_PATH}/factor_model_summary.csv`
  )
}

// ─────────────────────────────────────────────────────────────────
// DESCRIPTIVE STATISTICS
// ─────────────────────────────────────────────────────────────────

/**
 * Load all descriptive statistics (parallel fetch)
 */
export async function loadDescriptiveStatistics(): Promise<DescriptiveStatistics> {
  const cacheKey = 'descriptive_stats'
  
  const cached = dataCache.get<DescriptiveStatistics>(cacheKey)
  if (cached) return cached
  
  // Parallel fetch all distribution files
  const [
    patientSex,
    patientAge,
    ageGroups,
    rbcUnitsPerPatient,
    donorHb,
    donorSex,
    donorParity,
    donationWeekday,
    storage,
  ] = await Promise.all([
    fetchCSV<PatientSexDistribution>(`${DATA_BASE_PATH}/patient_sex_distribution.csv`),
    fetchCSV<PatientAgeStats>(`${DATA_BASE_PATH}/patient_age_stats.csv`),
    fetchCSV<AgeGroupDistribution>(`${DATA_BASE_PATH}/age_group_distribution.csv`),
    fetchCSV<RbcUnitsPerPatient>(`${DATA_BASE_PATH}/rbc_units_per_patient.csv`),
    fetchCSV<DonorHbDistribution>(`${DATA_BASE_PATH}/donor_hb_distribution.csv`),
    fetchCSV<DonorSexDistribution>(`${DATA_BASE_PATH}/donor_sex_distribution.csv`),
    fetchCSV<DonorParityDistribution>(`${DATA_BASE_PATH}/donor_parity_distribution.csv`),
    fetchCSV<DonationWeekdayDistribution>(`${DATA_BASE_PATH}/weekday_distribution.csv`),
    fetchCSV<StorageDistribution>(`${DATA_BASE_PATH}/storage_distribution.csv`),
  ])
  
  // Calculate totals from distributions
  const uniquePatients = patientSex.reduce((sum, row) => sum + row.count, 0)
  const totalUnits = donorHb.reduce((sum, row) => sum + row.count, 0)
  
  const result: DescriptiveStatistics = {
    uniquePatients,
    totalUnits,
    patientSex,
    patientAge: patientAge[0], // Single row with stats
    ageGroups,
    rbcUnitsPerPatient,
    donorHb,
    donorSex,
    donorParity,
    donationWeekday,
    storage,
  }
  
  dataCache.set(cacheKey, result)
  
  return result
}

// ─────────────────────────────────────────────────────────────────
// CACHE MANAGEMENT
// ─────────────────────────────────────────────────────────────────

/**
 * Clear all cached data
 */
export function clearDataCache(): void {
  dataCache.clear()
}

/**
 * Preload critical data for faster initial render
 */
export async function preloadData(): Promise<void> {
  await Promise.all([
    loadVizIndex(),
    loadObservedDataSummary(),
    loadModelBasedSummary(),
  ])
}

/**
 * Prefetch data for likely next interactions (non-blocking)
 */
export function prefetchVisualizationData(
  vitalParam: VitalParamCode,
  compFactor: CompFactorCode
): void {
  const cacheKey = `viz_${vitalParam}_${compFactor}`
  
  if (!dataCache.has(cacheKey)) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        loadVisualizationData(vitalParam, compFactor).catch(() => {
          // Silently fail prefetch
        })
      })
    }
  }
}
```

### 4. React Hooks for Data Consumption

**`src/hooks/useCSVData.ts`:**

```typescript
import { useState, useEffect, useCallback } from 'react'
import {
  loadVisualizationData,
  loadTransfusionData,
  loadDescriptiveStatistics,
  loadVizIndex,
  getAvailableVitalParams,
  getAvailableCompFactors,
  type VisualizationData,
} from '@/services/dataService'
import type {
  VitalParamCode,
  CompFactorCode,
  TransfusionDataRow,
  DescriptiveStatistics,
  VizIndexEntry,
} from '@/types'

// ─────────────────────────────────────────────────────────────────
// GENERIC ASYNC DATA HOOK
// ─────────────────────────────────────────────────────────────────

export interface AsyncDataState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Generic hook for async data loading with caching
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): AsyncDataState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return { data, loading, error, refetch: fetchData }
}

// ─────────────────────────────────────────────────────────────────
// SPECIALIZED HOOKS
// ─────────────────────────────────────────────────────────────────

/**
 * Hook for loading visualization data
 */
export function useVisualizationData(
  vitalParam: VitalParamCode | null,
  compFactor: CompFactorCode | null
): AsyncDataState<VisualizationData> {
  const [data, setData] = useState<VisualizationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const fetchData = useCallback(async () => {
    if (!vitalParam || !compFactor) {
      setData(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await loadVisualizationData(vitalParam, compFactor)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load visualization data'))
    } finally {
      setLoading(false)
    }
  }, [vitalParam, compFactor])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return { data, loading, error, refetch: fetchData }
}

/**
 * Hook for loading transfusion data
 */
export function useTransfusionData(
  vitalParam: VitalParamCode | null
): AsyncDataState<TransfusionDataRow[]> {
  const [data, setData] = useState<TransfusionDataRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const fetchData = useCallback(async () => {
    if (!vitalParam) {
      setData(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await loadTransfusionData(vitalParam)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load transfusion data'))
    } finally {
      setLoading(false)
    }
  }, [vitalParam])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return { data, loading, error, refetch: fetchData }
}

/**
 * Hook for loading descriptive statistics
 */
export function useDescriptiveStatistics(): AsyncDataState<DescriptiveStatistics> {
  return useAsyncData(loadDescriptiveStatistics, [])
}

/**
 * Hook for loading viz index
 */
export function useVizIndex(): AsyncDataState<VizIndexEntry[]> {
  return useAsyncData(loadVizIndex, [])
}

/**
 * Hook for available vital parameters
 */
export function useAvailableVitalParams(): AsyncDataState<VitalParamCode[]> {
  return useAsyncData(getAvailableVitalParams, [])
}

/**
 * Hook for available component factors
 */
export function useAvailableCompFactors(
  vitalParam: VitalParamCode | null
): AsyncDataState<CompFactorCode[]> {
  const [data, setData] = useState<CompFactorCode[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const fetchData = useCallback(async () => {
    if (!vitalParam) {
      setData(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await getAvailableCompFactors(vitalParam)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load factors'))
    } finally {
      setLoading(false)
    }
  }, [vitalParam])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return { data, loading, error, refetch: fetchData }
}
```

---

## File Structure

```
src/
├── services/
│   ├── csvParser.ts      # PapaParse wrapper
│   ├── cache.ts          # TTL cache implementation
│   └── dataService.ts    # Main data service
└── hooks/
    └── useCSVData.ts     # React hooks for data consumption
```

---

## Acceptance Criteria

- [ ] All functions have proper TypeScript types (no `any`)
- [ ] Cache prevents redundant network requests (verify in DevTools)
- [ ] File case detection works (uppercase/lowercase fallback)
- [ ] Error handling provides meaningful messages
- [ ] Hooks return loading/error/data states correctly
- [ ] `preloadData()` loads critical data on app start
- [ ] Memory usage is reasonable (cache doesn't grow unbounded)

---

## Testing Guidance

Create tests in `src/services/__tests__/dataService.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { dataCache } from '../cache'
import { loadVizIndex, clearDataCache } from '../dataService'

// Mock fetch
global.fetch = vi.fn()

describe('DataCache', () => {
  beforeEach(() => {
    dataCache.clear()
  })
  
  it('returns null for missing keys', () => {
    expect(dataCache.get('nonexistent')).toBeNull()
  })
  
  it('stores and retrieves data', () => {
    dataCache.set('test', { foo: 'bar' })
    expect(dataCache.get('test')).toEqual({ foo: 'bar' })
  })
  
  it('expires data after TTL', () => {
    vi.useFakeTimers()
    dataCache.set('test', { foo: 'bar' }, 1) // 1 minute TTL
    
    vi.advanceTimersByTime(61 * 1000) // 61 seconds
    expect(dataCache.get('test')).toBeNull()
    
    vi.useRealTimers()
  })
})

describe('loadVizIndex', () => {
  beforeEach(() => {
    clearDataCache()
    vi.clearAllMocks()
  })
  
  it('fetches and parses CSV correctly', async () => {
    const mockCSV = 'VitalParam,CompFactor,FileName\nARTm,DonorHb_Cat,viz_artm_donorhb.csv'
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockCSV),
    })
    
    const result = await loadVizIndex()
    
    expect(result).toHaveLength(1)
    expect(result[0].VitalParam).toBe('ARTm')
  })
  
  it('uses cache on second call', async () => {
    const mockCSV = 'VitalParam,CompFactor,FileName\nARTm,DonorHb_Cat,viz.csv'
    ;(fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockCSV),
    })
    
    await loadVizIndex()
    await loadVizIndex()
    
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
```

---

## Notes for Agent

1. **ESM Imports**: All imports use standard ES module syntax. No `require()` calls.

2. **Hook Dependencies**: The `useCallback` dependencies in hooks are intentionally structured to only re-fetch when the input parameters change.

3. **Error Boundaries**: Components using these hooks should wrap in error boundaries for graceful degradation.

4. **Cache Key Strategy**: Cache keys include all parameters that affect the result (e.g., `viz_${vital}_${factor}`).

5. **Prefetching**: `prefetchVisualizationData` uses `requestIdleCallback` to avoid blocking the main thread.