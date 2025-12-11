# T-016: Testing Setup & Critical Tests

| Field | Value |
|-------|-------|
| **ID** | T-016 |
| **Title** | Testing Setup & Critical Tests |
| **Phase** | 2 - Data Layer (parallel with T-003/T-004) |
| **Priority** | High |
| **Depends On** | T-001 |
| **Blocks** | None (but should complete before Phase 5) |
| **Estimated Effort** | 3-4 hours |

---

## Objective

Establish a comprehensive testing framework and write unit tests for critical application logic: data service, state management, and utility functions.

---

## Context

The analysis identified a missing testing strategy. Testing should focus on:
1. **Data Layer (T-004)**: Cache behavior, CSV parsing, error handling
2. **State Management (T-005)**: Store actions, cascading resets, selectors
3. **Utility Functions**: Data transformations, type guards

Testing React components (tabs, charts) can be added later with React Testing Library, but the critical logic tests should be in place early.

---

## Requirements

### 1. Testing Infrastructure

**Install dependencies** (add to T-001's package.json):

```json
{
  "devDependencies": {
    "vitest": "^1.6.0",
    "@testing-library/react": "^14.3.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^24.0.0",
    "msw": "^2.3.0"
  }
}
```

**Create `vitest.config.ts`:**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Create `src/test/setup.ts`:**

```typescript
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
```

**Add to `package.json` scripts:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### 2. Cache Tests

**Create `src/services/__tests__/cache.test.ts`:**

```typescript
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
    
    it('does nothing for nonexistent keys', () => {
      expect(() => cache.delete('nonexistent')).not.toThrow()
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
  })
})
```

### 3. CSV Parser Tests

**Create `src/services/__tests__/csvParser.test.ts`:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseCSV, fetchCSV } from '../csvParser'

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
    
    expect(result[0].value).toBe(42)
    expect(result[0].flag).toBe(true)
    expect(result[1].value).toBe(3.14)
    expect(result[1].flag).toBe(false)
  })
  
  it('skips empty lines', () => {
    const csv = 'col\na\n\nb\n\n'
    const result = parseCSV<{ col: string }>(csv)
    
    expect(result).toHaveLength(2)
  })
  
  it('handles quoted values with commas', () => {
    const csv = 'name,description\n"Doe, John","A person"'
    const result = parseCSV<{ name: string; description: string }>(csv)
    
    expect(result[0].name).toBe('Doe, John')
  })
  
  it('handles custom header transform', () => {
    const csv = 'UPPER_CASE,MixedCase\n1,2'
    const result = parseCSV<{ upper_case: number; mixedcase: number }>(csv, {
      transformHeader: (h) => h.toLowerCase(),
    })
    
    expect(result[0]).toHaveProperty('upper_case')
    expect(result[0]).toHaveProperty('mixedcase')
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
```

### 4. Data Service Tests

**Create `src/services/__tests__/dataService.test.ts`:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  loadVizIndex, 
  loadVisualizationData,
  getAvailableVitalParams,
  getAvailableCompFactors,
  clearDataCache,
  preloadData,
} from '../dataService'
import { dataCache } from '../cache'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('dataService', () => {
  beforeEach(() => {
    clearDataCache()
    mockFetch.mockClear()
  })
  
  describe('loadVizIndex', () => {
    const mockIndexCSV = `VitalParam,CompFactor,FileName
ARTm,DonorHb_Cat,viz_artm_donorhb.csv
ARTm,Storage_Cat,viz_artm_storage.csv
HR,DonorHb_Cat,viz_hr_donorhb.csv`
    
    it('fetches and parses viz index', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockIndexCSV),
      })
      
      const result = await loadVizIndex()
      
      expect(result).toHaveLength(3)
      expect(result[0].VitalParam).toBe('ARTm')
      expect(result[0].CompFactor).toBe('DonorHb_Cat')
    })
    
    it('uses cache on subsequent calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockIndexCSV),
      })
      
      await loadVizIndex()
      await loadVizIndex()
      await loadVizIndex()
      
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
  
  describe('getAvailableVitalParams', () => {
    it('extracts unique vital parameters from index', async () => {
      const mockCSV = `VitalParam,CompFactor,FileName
ARTm,DonorHb_Cat,f1.csv
ARTm,Storage_Cat,f2.csv
HR,DonorHb_Cat,f3.csv
SPO2,DonorHb_Cat,f4.csv`
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockCSV),
      })
      
      const vitals = await getAvailableVitalParams()
      
      expect(vitals).toHaveLength(3)
      expect(vitals).toContain('ARTm')
      expect(vitals).toContain('HR')
      expect(vitals).toContain('SPO2')
    })
  })
  
  describe('getAvailableCompFactors', () => {
    it('filters factors by vital parameter', async () => {
      const mockCSV = `VitalParam,CompFactor,FileName
ARTm,DonorHb_Cat,f1.csv
ARTm,Storage_Cat,f2.csv
HR,DonorHb_Cat,f3.csv`
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockCSV),
      })
      
      const factors = await getAvailableCompFactors('ARTm')
      
      expect(factors).toHaveLength(2)
      expect(factors).toContain('DonorHb_Cat')
      expect(factors).toContain('Storage_Cat')
    })
  })
  
  describe('loadVisualizationData', () => {
    const mockVizCSV = `TimeFromTransfusion,DonorHb_Cat,PredVal_Full,Delta_Full
0,Low,75.5,0
60,Low,76.2,0.7
0,High,74.8,0
60,High,75.1,0.3`
    
    it('loads and structures visualization data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockVizCSV),
      })
      
      const result = await loadVisualizationData('ARTm', 'DonorHb_Cat')
      
      expect(result.rows).toHaveLength(4)
      expect(result.comparisonColumn).toBe('DonorHb_Cat')
      expect(result.comparisonValues).toContain('Low')
      expect(result.comparisonValues).toContain('High')
    })
    
    it('tries fallback path on 404', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockVizCSV),
        })
      
      const result = await loadVisualizationData('ARTm', 'DonorHb_Cat')
      
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result.rows).toHaveLength(4)
    })
  })
  
  describe('preloadData', () => {
    it('preloads critical data in parallel', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('col\nval'),
      })
      
      await preloadData()
      
      // Should have called fetch for viz_index, observed_summary, model_summary
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })
})
```

### 5. Zustand Store Tests

**Create `src/stores/__tests__/dashboardStore.test.ts`:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useDashboardStore } from '../dashboardStore'
import { act } from '@testing-library/react'

describe('dashboardStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useDashboardStore.setState({
      theme: 'dark',
      activeTab: 'main-findings',
      isLoading: false,
      error: null,
      selectedVital: null,
      selectedCompFactor: null,
      selectedComparisons: [],
      timeRange: [0, 720],
      displayOptions: {
        showConfidenceInterval: true,
        showBaseModel: false,
        showDeltaPlot: true,
      },
      transfusionSelectedVitals: [],
      transfusionTimeRange: [0, 720],
      transfusionDisplayOptions: {
        showConfidenceInterval: true,
        showBaseModel: false,
        showDeltaPlot: true,
      },
      availableVitals: [],
      availableCompFactors: [],
      visualizationData: null,
    })
  })
  
  describe('theme', () => {
    it('toggles theme', () => {
      const { toggleTheme } = useDashboardStore.getState()
      
      expect(useDashboardStore.getState().theme).toBe('dark')
      
      act(() => toggleTheme())
      expect(useDashboardStore.getState().theme).toBe('light')
      
      act(() => toggleTheme())
      expect(useDashboardStore.getState().theme).toBe('dark')
    })
    
    it('sets theme directly', () => {
      const { setTheme } = useDashboardStore.getState()
      
      act(() => setTheme('light'))
      expect(useDashboardStore.getState().theme).toBe('light')
    })
  })
  
  describe('tab navigation', () => {
    it('changes active tab', () => {
      const { setActiveTab } = useDashboardStore.getState()
      
      act(() => setActiveTab('rbc-transfusions'))
      expect(useDashboardStore.getState().activeTab).toBe('rbc-transfusions')
    })
  })
  
  describe('cascading resets', () => {
    it('resets compFactor and comparisons when vital changes', () => {
      const store = useDashboardStore.getState()
      
      // Set initial state
      act(() => {
        store.setSelectedVital('ARTm')
        store.setSelectedCompFactor('DonorHb_Cat')
        store.selectAllComparisons(['Low', 'Medium', 'High'])
      })
      
      // Verify state was set
      expect(useDashboardStore.getState().selectedCompFactor).toBe('DonorHb_Cat')
      expect(useDashboardStore.getState().selectedComparisons).toHaveLength(3)
      
      // Change vital - should cascade reset
      act(() => {
        useDashboardStore.getState().setSelectedVital('HR')
      })
      
      expect(useDashboardStore.getState().selectedVital).toBe('HR')
      expect(useDashboardStore.getState().selectedCompFactor).toBeNull()
      expect(useDashboardStore.getState().selectedComparisons).toEqual([])
    })
    
    it('resets comparisons when compFactor changes', () => {
      const store = useDashboardStore.getState()
      
      act(() => {
        store.setSelectedVital('ARTm')
        store.setSelectedCompFactor('DonorHb_Cat')
        store.selectAllComparisons(['Low', 'Medium', 'High'])
      })
      
      expect(useDashboardStore.getState().selectedComparisons).toHaveLength(3)
      
      act(() => {
        useDashboardStore.getState().setSelectedCompFactor('Storage_Cat')
      })
      
      expect(useDashboardStore.getState().selectedCompFactor).toBe('Storage_Cat')
      expect(useDashboardStore.getState().selectedComparisons).toEqual([])
    })
  })
  
  describe('comparison selection', () => {
    it('toggles individual comparisons', () => {
      const { toggleComparison } = useDashboardStore.getState()
      
      act(() => toggleComparison('Low'))
      expect(useDashboardStore.getState().selectedComparisons).toContain('Low')
      
      act(() => toggleComparison('Low'))
      expect(useDashboardStore.getState().selectedComparisons).not.toContain('Low')
    })
    
    it('selects all comparisons', () => {
      const { selectAllComparisons } = useDashboardStore.getState()
      
      act(() => selectAllComparisons(['A', 'B', 'C']))
      expect(useDashboardStore.getState().selectedComparisons).toEqual(['A', 'B', 'C'])
    })
    
    it('deselects all when passed empty array', () => {
      const { selectAllComparisons } = useDashboardStore.getState()
      
      act(() => selectAllComparisons(['A', 'B']))
      act(() => selectAllComparisons([]))
      
      expect(useDashboardStore.getState().selectedComparisons).toEqual([])
    })
  })
  
  describe('time range', () => {
    it('sets time range', () => {
      const { setTimeRange } = useDashboardStore.getState()
      
      act(() => setTimeRange([60, 360]))
      expect(useDashboardStore.getState().timeRange).toEqual([60, 360])
    })
  })
  
  describe('display options', () => {
    it('toggles individual options', () => {
      const { setDisplayOption } = useDashboardStore.getState()
      
      act(() => setDisplayOption('showBaseModel', true))
      expect(useDashboardStore.getState().displayOptions.showBaseModel).toBe(true)
      
      act(() => setDisplayOption('showConfidenceInterval', false))
      expect(useDashboardStore.getState().displayOptions.showConfidenceInterval).toBe(false)
    })
  })
  
  describe('transfusion tab', () => {
    it('toggles vital parameters', () => {
      const { toggleTransfusionVital } = useDashboardStore.getState()
      
      act(() => toggleTransfusionVital('ARTm'))
      expect(useDashboardStore.getState().transfusionSelectedVitals).toContain('ARTm')
      
      act(() => toggleTransfusionVital('HR'))
      expect(useDashboardStore.getState().transfusionSelectedVitals).toEqual(['ARTm', 'HR'])
      
      act(() => toggleTransfusionVital('ARTm'))
      expect(useDashboardStore.getState().transfusionSelectedVitals).toEqual(['HR'])
    })
  })
  
  describe('loading and error states', () => {
    it('sets loading state', () => {
      const { setLoading } = useDashboardStore.getState()
      
      act(() => setLoading(true))
      expect(useDashboardStore.getState().isLoading).toBe(true)
      
      act(() => setLoading(false))
      expect(useDashboardStore.getState().isLoading).toBe(false)
    })
    
    it('sets and clears error', () => {
      const { setError, clearError } = useDashboardStore.getState()
      
      act(() => setError('Something went wrong'))
      expect(useDashboardStore.getState().error).toBe('Something went wrong')
      
      act(() => clearError())
      expect(useDashboardStore.getState().error).toBeNull()
    })
  })
})
```

### 6. Type Guard Tests

**Create `src/types/__tests__/guards.test.ts`:**

```typescript
import { describe, it, expect } from 'vitest'
import { isVitalParamCode, isCompFactorCode, VITAL_PARAM_CODES, COMP_FACTOR_CODES } from '../vitals'

describe('type guards', () => {
  describe('isVitalParamCode', () => {
    it('returns true for valid vital param codes', () => {
      VITAL_PARAM_CODES.forEach(code => {
        expect(isVitalParamCode(code)).toBe(true)
      })
    })
    
    it('returns false for invalid codes', () => {
      expect(isVitalParamCode('INVALID')).toBe(false)
      expect(isVitalParamCode('')).toBe(false)
      expect(isVitalParamCode(null)).toBe(false)
      expect(isVitalParamCode(undefined)).toBe(false)
      expect(isVitalParamCode(123)).toBe(false)
    })
  })
  
  describe('isCompFactorCode', () => {
    it('returns true for valid comp factor codes', () => {
      COMP_FACTOR_CODES.forEach(code => {
        expect(isCompFactorCode(code)).toBe(true)
      })
    })
    
    it('returns false for invalid codes', () => {
      expect(isCompFactorCode('INVALID')).toBe(false)
      expect(isCompFactorCode('')).toBe(false)
    })
  })
})
```

---

## File Structure

```
src/
├── test/
│   └── setup.ts              # Test setup and mocks
├── services/
│   └── __tests__/
│       ├── cache.test.ts
│       ├── csvParser.test.ts
│       └── dataService.test.ts
├── stores/
│   └── __tests__/
│       └── dashboardStore.test.ts
└── types/
    └── __tests__/
        └── guards.test.ts
vitest.config.ts
```

---

## Acceptance Criteria

- [ ] `npm test` runs all tests successfully
- [ ] `npm run test:coverage` produces coverage report
- [ ] Cache tests verify TTL expiration behavior
- [ ] CSV parser tests verify parsing and type conversion
- [ ] Data service tests verify caching and fallback paths
- [ ] Store tests verify all actions and cascading resets
- [ ] Type guard tests verify validation logic
- [ ] Coverage > 80% for services and stores

---

## Notes for Agent

1. **Run tests frequently**: Run `npm test` after each test file addition.

2. **Mock Isolation**: Each test file should reset mocks in `beforeEach`.

3. **Zustand Testing**: Use `useDashboardStore.setState()` to reset between tests.

4. **Fake Timers**: Use `vi.useFakeTimers()` for TTL/timeout tests.

5. **Future Expansion**: Component tests with React Testing Library can be added later for UI verification.