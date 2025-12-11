# T-014: Performance Optimization

| Field | Value |
|-------|-------|
| **ID** | T-014 |
| **Title** | Performance Optimization |
| **Phase** | 6 - Polish & Deploy |
| **Priority** | High |
| **Depends On** | T-009, T-010, T-011, T-012 |
| **Blocks** | T-015 |
| **Estimated Effort** | 3-4 hours |

---

## Objective

Optimize the dashboard for fast initial load and smooth runtime performance. Target: Lighthouse performance score > 90, initial load < 3s on 3G.

---

## Context

Performance concerns:
- 60+ CSV files totaling ~120MB
- 35 small multiple charts on Main Findings tab
- Multiple Chart.js instances
- Large JavaScript bundle from Chart.js + lodash

Optimization strategies:
- Code splitting and lazy loading
- Data loading optimization
- Memoization and virtualization
- Bundle size reduction

---

## Requirements

### 1. Code Splitting with React.lazy

**Update `src/App.tsx`:**

```typescript
import { Suspense, lazy, useEffect } from 'react'
import { Layout, TabPanel } from '@/components/layout'
import { useDashboardStore, useThemeSync } from '@/stores/dashboardStore'
import { preloadData } from '@/services/dataService'
import './styles/global.css'

// Lazy load tab components
const MainFindingsTab = lazy(() => 
  import('@/components/tabs/MainFindings').then(m => ({ default: m.MainFindingsTab }))
)
const RBCTransfusionsTab = lazy(() => 
  import('@/components/tabs/RBCTransfusions').then(m => ({ default: m.RBCTransfusionsTab }))
)
const ComponentFactorEffectsTab = lazy(() => 
  import('@/components/tabs/ComponentFactorEffects').then(m => ({ default: m.ComponentFactorEffectsTab }))
)
const DescriptiveStatisticsTab = lazy(() => 
  import('@/components/tabs/DescriptiveStatistics').then(m => ({ default: m.DescriptiveStatisticsTab }))
)

function TabFallback() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      height: '300px',
      color: 'var(--color-text-muted)'
    }}>
      Loading tab...
    </div>
  )
}

function App() {
  useThemeSync()
  
  // Preload critical data on mount
  useEffect(() => {
    preloadData().catch(console.error)
  }, [])

  return (
    <Layout>
      <Suspense fallback={<TabFallback />}>
        <TabPanel id="main-findings">
          <MainFindingsTab />
        </TabPanel>
        
        <TabPanel id="rbc-transfusions">
          <RBCTransfusionsTab />
        </TabPanel>
        
        <TabPanel id="component-factor-effects">
          <ComponentFactorEffectsTab />
        </TabPanel>
        
        <TabPanel id="descriptive-statistics">
          <DescriptiveStatisticsTab />
        </TabPanel>
      </Suspense>
    </Layout>
  )
}

export default App
```

### 2. Optimized Data Service with Prefetching

**Update `src/services/dataService.ts`** — add prefetching:

```typescript
// Add to existing dataService.ts

/**
 * Prefetch data for likely next interactions
 */
export function prefetchVisualizationData(
  vitalParam: VitalParamCode, 
  compFactor: CompFactorCode
): void {
  const cacheKey = `viz_${vitalParam}_${compFactor}`
  
  // Only prefetch if not already cached
  if (!dataCache.has(cacheKey)) {
    // Use requestIdleCallback for non-blocking prefetch
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        loadVisualizationData(vitalParam, compFactor).catch(() => {
          // Silently fail prefetch
        })
      })
    }
  }
}

/**
 * Prefetch all visualization data for a vital parameter
 */
export async function prefetchAllFactorsForVital(
  vitalParam: VitalParamCode
): Promise<void> {
  const factors = await getAvailableCompFactors(vitalParam)
  factors.forEach(factor => {
    prefetchVisualizationData(vitalParam, factor)
  })
}

/**
 * Convert CSV to JSON at runtime (faster parsing)
 */
export function enableJsonMode(): void {
  // This would be called if JSON files are available
  // JSON.parse is 3-5x faster than PapaParse
  console.log('JSON mode enabled')
}
```

### 3. Memoized Chart Data Preparation

**Create `src/hooks/useMemoizedChartData.ts`:**

```typescript
import { useMemo } from 'react'
import { prepareVisualizationChartData, prepareTransfusionChartData } from '@/components/charts'
import type { 
  VisualizationDataRow, 
  TransfusionDataRow, 
  TimeRange, 
  ChartDisplayOptions 
} from '@/types'

/**
 * Memoized visualization chart data hook
 */
export function useMemoizedVisualizationData(
  rows: VisualizationDataRow[] | null,
  comparisonColumn: string | null,
  selectedComparisons: (string | number)[],
  timeRange: TimeRange,
  displayOptions: ChartDisplayOptions
) {
  return useMemo(() => {
    if (!rows || !comparisonColumn) return null
    
    return prepareVisualizationChartData(
      rows,
      comparisonColumn,
      selectedComparisons,
      timeRange,
      displayOptions
    )
  }, [
    rows,
    comparisonColumn,
    // Use JSON stringification for array comparison
    JSON.stringify(selectedComparisons),
    timeRange[0],
    timeRange[1],
    displayOptions.showConfidenceInterval,
    displayOptions.showBaseModel,
    displayOptions.showDeltaPlot,
  ])
}

/**
 * Memoized transfusion chart data hook
 */
export function useMemoizedTransfusionData(
  rows: TransfusionDataRow[] | null,
  timeRange: TimeRange,
  displayOptions: ChartDisplayOptions
) {
  return useMemo(() => {
    if (!rows) return null
    
    return prepareTransfusionChartData(rows, timeRange, displayOptions)
  }, [
    rows,
    timeRange[0],
    timeRange[1],
    displayOptions.showConfidenceInterval,
    displayOptions.showBaseModel,
    displayOptions.showDeltaPlot,
  ])
}
```

### 4. Virtualized Small Multiples Grid

**Create `src/components/tabs/MainFindings/VirtualizedGrid.tsx`:**

```typescript
import { useState, useRef, useEffect, useCallback } from 'react'
import type { VizIndexEntry, VitalParamCode, CompFactorCode } from '@/types'
import { VITAL_PARAM_CODES, COMP_FACTOR_CODES } from '@/types'
import { SmallMultipleChart } from './SmallMultipleChart'
import styles from './MainFindings.module.css'

interface VirtualizedGridProps {
  vizIndex: VizIndexEntry[]
}

const ROW_HEIGHT = 80
const VISIBLE_BUFFER = 2 // Extra rows to render above/below viewport

export function VirtualizedGrid({ vizIndex }: VirtualizedGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 7 })
  
  // Create index map
  const indexMap = new Map<string, VizIndexEntry>()
  vizIndex.forEach(entry => {
    indexMap.set(`${entry.VitalParam}_${entry.CompFactor}`, entry)
  })
  
  // Handle scroll
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    
    const scrollTop = container.scrollTop
    const containerHeight = container.clientHeight
    
    const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - VISIBLE_BUFFER)
    const endRow = Math.min(
      VITAL_PARAM_CODES.length,
      Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + VISIBLE_BUFFER
    )
    
    setVisibleRange({ start: startRow, end: endRow })
  }, [])
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    container.addEventListener('scroll', handleScroll)
    handleScroll() // Initial calculation
    
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
  
  const totalHeight = VITAL_PARAM_CODES.length * ROW_HEIGHT
  const visibleVitals = VITAL_PARAM_CODES.slice(visibleRange.start, visibleRange.end)
  
  return (
    <div 
      ref={containerRef}
      className={styles.virtualContainer}
      style={{ height: '500px', overflow: 'auto' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Header (fixed) */}
        <div className={styles.gridHeader} style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <div className={styles.gridCorner} />
          {COMP_FACTOR_CODES.map(factor => (
            <div key={factor} className={styles.gridHeaderCell}>
              {factor}
            </div>
          ))}
        </div>
        
        {/* Virtualized rows */}
        {visibleVitals.map((vital, index) => (
          <div
            key={vital}
            className={styles.gridRow}
            style={{
              position: 'absolute',
              top: (visibleRange.start + index) * ROW_HEIGHT + ROW_HEIGHT, // +ROW_HEIGHT for header
              left: 0,
              right: 0,
              height: ROW_HEIGHT,
            }}
          >
            <div className={styles.gridRowHeader}>{vital}</div>
            {COMP_FACTOR_CODES.map(factor => {
              const key = `${vital}_${factor}`
              const entry = indexMap.get(key)
              
              return (
                <div key={key} className={styles.gridCell}>
                  {entry && (
                    <SmallMultipleChart
                      vitalParam={vital}
                      compFactor={factor}
                      fileName={entry.FileName}
                      isHovered={false}
                    />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 5. Bundle Analysis Configuration

**Add to `package.json` scripts:**

```json
{
  "scripts": {
    "analyze": "npx vite-bundle-visualizer"
  }
}
```

**Create `vite.config.ts` optimizations:**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // ... other aliases
    },
  },
  build: {
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          'vendor-data': ['papaparse', 'lodash-es'],
        },
      },
    },
    // Target modern browsers for smaller bundle
    target: 'es2020',
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // Optimize dev server
  server: {
    port: 3000,
    open: true,
  },
})
```

### 6. Image and Asset Optimization

**Create `public/data/.htaccess`** (if using Apache) or configure in deployment:

```
# Enable compression
AddOutputFilterByType DEFLATE text/csv
AddOutputFilterByType DEFLATE application/json

# Cache CSV files for 1 week
<FilesMatch "\.(csv|json)$">
  Header set Cache-Control "public, max-age=604800"
</FilesMatch>
```

### 7. Performance Monitoring Hook

**Create `src/hooks/usePerformanceMonitor.ts`:**

```typescript
import { useEffect } from 'react'

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    // Mark component mount
    const markName = `${componentName}-mount`
    performance.mark(markName)
    
    return () => {
      // Measure time from mount to unmount
      try {
        performance.measure(`${componentName}-lifetime`, markName)
        const entries = performance.getEntriesByName(`${componentName}-lifetime`)
        if (entries.length > 0) {
          console.debug(`${componentName} lifetime: ${entries[0].duration.toFixed(2)}ms`)
        }
      } catch (e) {
        // Ignore if mark was already cleared
      }
    }
  }, [componentName])
}

/**
 * Report Web Vitals
 */
export function reportWebVitals() {
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      console.log('LCP:', lastEntry.startTime.toFixed(2), 'ms')
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    
    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        console.log('FID:', entry.processingStart - entry.startTime, 'ms')
      })
    }).observe({ type: 'first-input', buffered: true })
    
    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsScore = 0
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value
        }
      })
      console.log('CLS:', clsScore.toFixed(4))
    }).observe({ type: 'layout-shift', buffered: true })
  }
}
```

### 8. Service Worker for Offline CSV Caching

**Create `public/sw.js`:**

```javascript
const CACHE_NAME = 'scandat-data-v1'
const DATA_URLS = [
  '/data/viz_index.csv',
  '/data/observed_data_summary.csv',
  '/data/model_based_summary.csv',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(DATA_URLS)
    })
  )
})

self.addEventListener('fetch', (event) => {
  // Only cache CSV files
  if (event.request.url.includes('/data/') && event.request.url.endsWith('.csv')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request).then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
      })
    )
  }
})
```

**Register in `src/main.tsx`:**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Register service worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## Acceptance Criteria

- [ ] Lighthouse Performance score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3s on Fast 3G
- [ ] Total bundle size < 500KB (gzipped)
- [ ] Tab switching feels instant (< 100ms)
- [ ] Chart updates are smooth (no jank)
- [ ] CSV data is cached in service worker
- [ ] `npm run analyze` shows no unexpected large chunks

---

## Testing

1. **Lighthouse Audit**:
   ```bash
   npm run build
   npm run preview
   # Open Chrome DevTools > Lighthouse > Run audit
   ```

2. **Bundle Analysis**:
   ```bash
   npm run analyze
   # Check for unexpected large dependencies
   ```

3. **Network Throttling**:
   - Chrome DevTools > Network > Slow 3G
   - Verify app loads and functions

4. **Memory Profiling**:
   - Chrome DevTools > Memory > Take heap snapshot
   - Switch tabs multiple times
   - Verify no memory leaks (chart instances cleaned up)

---

## Notes for Agent

1. **Lazy Loading**: Each tab is a separate chunk. Only loaded when accessed.

2. **Memoization**: Use JSON.stringify for array dependencies in useMemo to prevent false positives.

3. **Virtualization**: Only render visible rows in small multiples grid.

4. **Service Worker**: Only cache in production. CSV files should be cached for offline use.

5. **Manual Chunks**: Separate vendor chunks improve cache hit rates on updates.