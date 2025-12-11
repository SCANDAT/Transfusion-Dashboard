# T-011: Component Factor Effects Tab

| Field | Value |
|-------|-------|
| **ID** | T-011 |
| **Title** | Component Factor Effects Tab |
| **Phase** | 5 - Tab Implementations |
| **Priority** | High |
| **Depends On** | T-004, T-006, T-007, T-008 |
| **Blocks** | T-013 |
| **Estimated Effort** | 5-6 hours |

---

## Objective

Implement the Component Factor Effects tab, the most complex tab showing how RBC component characteristics (donor Hb, storage time, donor sex, etc.) affect vital parameter responses to transfusion.

---

## Context

This tab in the legacy application:
- Cascading selection: Vital → Component Factor → Comparison Groups
- Dynamic comparison tags based on selected factor's categories
- Main effect chart + delta chart
- Confidence interval bands
- Legend synchronized with selected comparisons
- Export functionality

This is the core of `dashboard.js` (798 lines) in the legacy codebase.

---

## Requirements

### 1. Tab Container

**`src/components/tabs/ComponentFactorEffects/index.tsx`:**

```typescript
import { useEffect, useCallback } from 'react'
import { useDashboardStore, selectComponentFactorState } from '@/stores/dashboardStore'
import { 
  loadVisualizationData, 
  getAvailableVitalParams,
  getAvailableCompFactors 
} from '@/services/dataService'
import { useAsyncData } from '@/hooks/useCSVData'
import { 
  VitalParamSelector, 
  CompFactorSelector, 
  ComparisonTags,
  TimeRangeSlider, 
  DisplayOptions 
} from '@/components/controls'
import { EffectCharts } from './EffectCharts'
import type { VitalParamCode, CompFactorCode } from '@/types'
import styles from './ComponentFactorEffects.module.css'

export function ComponentFactorEffectsTab() {
  const {
    selectedVital,
    selectedCompFactor,
    selectedComparisons,
    timeRange,
    displayOptions,
    visualizationData,
    setSelectedVital,
    setSelectedCompFactor,
    toggleComparison,
    selectAllComparisons,
    setTimeRange,
    setDisplayOption,
    setVisualizationData,
    setAvailableVitals,
    setAvailableCompFactors,
    availableVitals,
    availableCompFactors,
    setLoading,
    setError,
  } = useDashboardStore()
  
  // Load available vitals on mount
  const { data: vitals } = useAsyncData(getAvailableVitalParams, [])
  
  useEffect(() => {
    if (vitals && vitals.length > 0) {
      setAvailableVitals(vitals)
    }
  }, [vitals, setAvailableVitals])
  
  // Load available factors when vital changes
  useEffect(() => {
    if (selectedVital) {
      getAvailableCompFactors(selectedVital)
        .then(setAvailableCompFactors)
        .catch(err => setError(err.message))
    }
  }, [selectedVital, setAvailableCompFactors, setError])
  
  // Load visualization data when vital + factor selected
  useEffect(() => {
    if (selectedVital && selectedCompFactor) {
      setLoading(true)
      loadVisualizationData(selectedVital, selectedCompFactor)
        .then(data => {
          setVisualizationData(data)
          // Auto-select all comparisons
          if (data.comparisonValues.length > 0) {
            selectAllComparisons(data.comparisonValues)
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [selectedVital, selectedCompFactor, setVisualizationData, selectAllComparisons, setLoading, setError])
  
  const handleVitalChange = useCallback((vital: VitalParamCode) => {
    setSelectedVital(vital)
  }, [setSelectedVital])
  
  const handleFactorChange = useCallback((factor: CompFactorCode) => {
    setSelectedCompFactor(factor)
  }, [setSelectedCompFactor])
  
  const handleSelectAll = useCallback(() => {
    if (visualizationData) {
      selectAllComparisons(visualizationData.comparisonValues)
    }
  }, [visualizationData, selectAllComparisons])
  
  const handleDeselectAll = useCallback(() => {
    selectAllComparisons([])
  }, [selectAllComparisons])
  
  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.controls}>
          <VitalParamSelector
            value={selectedVital}
            availableParams={availableVitals}
            onChange={handleVitalChange}
          />
          
          <CompFactorSelector
            value={selectedCompFactor}
            availableFactors={availableCompFactors}
            onChange={handleFactorChange}
            disabled={!selectedVital}
          />
          
          {visualizationData && selectedCompFactor && (
            <ComparisonTags
              comparisonColumn={selectedCompFactor}
              availableValues={visualizationData.comparisonValues}
              selectedValues={selectedComparisons}
              onToggle={toggleComparison}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />
          )}
          
          <TimeRangeSlider
            value={timeRange}
            onChange={setTimeRange}
            min={0}
            max={720}
          />
          
          <DisplayOptions
            options={displayOptions}
            onChange={setDisplayOption}
          />
        </div>
      </div>
      
      <div className={styles.main}>
        {!selectedVital ? (
          <div className={styles.placeholder}>
            Select a vital parameter to begin
          </div>
        ) : !selectedCompFactor ? (
          <div className={styles.placeholder}>
            Select a component factor to view effects
          </div>
        ) : !visualizationData ? (
          <div className={styles.placeholder}>
            Loading visualization data...
          </div>
        ) : selectedComparisons.length === 0 ? (
          <div className={styles.placeholder}>
            Select at least one comparison group
          </div>
        ) : (
          <EffectCharts
            data={visualizationData}
            selectedComparisons={selectedComparisons}
            timeRange={timeRange}
            displayOptions={displayOptions}
          />
        )}
      </div>
    </div>
  )
}
```

### 2. Effect Charts Component

**`src/components/tabs/ComponentFactorEffects/EffectCharts.tsx`:**

```typescript
import { useRef, useCallback } from 'react'
import type { Chart as ChartInstance, ChartOptions } from 'chart.js'
import { BaseChart, exportChartAsSVG, prepareVisualizationChartData } from '@/components/charts'
import { COMP_FACTORS, type VisualizationData, type TimeRange, type ChartDisplayOptions } from '@/types'
import { useChartTheme } from '@/hooks/useChartTheme'
import styles from './ComponentFactorEffects.module.css'

interface EffectChartsProps {
  data: VisualizationData
  selectedComparisons: (string | number)[]
  timeRange: TimeRange
  displayOptions: ChartDisplayOptions
}

export function EffectCharts({
  data,
  selectedComparisons,
  timeRange,
  displayOptions,
}: EffectChartsProps) {
  const mainChartRef = useRef<ChartInstance | null>(null)
  const deltaChartRef = useRef<ChartInstance | null>(null)
  const chartTheme = useChartTheme()
  
  const { metadata, comparisonColumn } = data
  const factorInfo = COMP_FACTORS[comparisonColumn]
  
  // Prepare chart data for main plot (absolute values)
  const mainChartData = prepareVisualizationChartData(
    data.rows,
    comparisonColumn,
    selectedComparisons,
    timeRange,
    { ...displayOptions, showDeltaPlot: false }
  )
  
  // Prepare chart data for delta plot
  const deltaChartData = prepareVisualizationChartData(
    data.rows,
    comparisonColumn,
    selectedComparisons,
    timeRange,
    { ...displayOptions, showDeltaPlot: true }
  )
  
  // Common options
  const baseOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          filter: (item) => {
            // Hide CI band labels
            return !item.text?.includes('CI')
          },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Time from Transfusion (minutes)',
        },
        min: timeRange[0],
        max: timeRange[1],
      },
    },
  }
  
  const mainOptions: ChartOptions<'line'> = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      title: {
        display: true,
        text: `${metadata.vitalName} by ${factorInfo.name}`,
        font: { size: 16, weight: 'bold' },
      },
    },
    scales: {
      ...baseOptions.scales,
      y: {
        title: {
          display: true,
          text: metadata.yLabel,
        },
      },
    },
  }
  
  const deltaOptions: ChartOptions<'line'> = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      title: {
        display: true,
        text: `Change in ${metadata.vitalName} by ${factorInfo.name}`,
        font: { size: 16, weight: 'bold' },
      },
    },
    scales: {
      ...baseOptions.scales,
      y: {
        title: {
          display: true,
          text: metadata.deltaYLabel,
        },
      },
    },
  }
  
  const handleExportMain = useCallback(() => {
    if (mainChartRef.current) {
      const filename = `${data.rows[0]?.VitalParam}_${comparisonColumn}_effect.svg`
      exportChartAsSVG(mainChartRef.current, filename)
    }
  }, [data.rows, comparisonColumn])
  
  const handleExportDelta = useCallback(() => {
    if (deltaChartRef.current) {
      const filename = `${data.rows[0]?.VitalParam}_${comparisonColumn}_delta.svg`
      exportChartAsSVG(deltaChartRef.current, filename)
    }
  }, [data.rows, comparisonColumn])
  
  return (
    <div className={styles.chartsContainer}>
      <div className={styles.chartCard}>
        <div className={styles.chartWrapper}>
          <BaseChart
            type="line"
            data={mainChartData}
            options={mainOptions}
            height={400}
            onChartReady={(chart) => { mainChartRef.current = chart }}
          />
        </div>
        <button className={styles.exportBtn} onClick={handleExportMain}>
          Export SVG
        </button>
      </div>
      
      {displayOptions.showDeltaPlot && (
        <div className={styles.chartCard}>
          <div className={styles.chartWrapper}>
            <BaseChart
              type="line"
              data={deltaChartData}
              options={deltaOptions}
              height={400}
              onChartReady={(chart) => { deltaChartRef.current = chart }}
            />
          </div>
          <button className={styles.exportBtn} onClick={handleExportDelta}>
            Export SVG
          </button>
        </div>
      )}
      
      <div className={styles.dataInfo}>
        <h4>Data Summary</h4>
        <dl className={styles.infoList}>
          <dt>Vital Parameter</dt>
          <dd>{metadata.vitalName}</dd>
          <dt>Component Factor</dt>
          <dd>{metadata.compName}</dd>
          <dt>Data Points</dt>
          <dd>{data.rows.length.toLocaleString()}</dd>
          <dt>Comparison Groups</dt>
          <dd>{selectedComparisons.length} of {data.comparisonValues.length}</dd>
          <dt>Time Range</dt>
          <dd>{timeRange[0]} – {timeRange[1]} minutes</dd>
        </dl>
      </div>
    </div>
  )
}
```

### 3. Styles

**`src/components/tabs/ComponentFactorEffects/ComponentFactorEffects.module.css`:**

```css
.container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--spacing-6);
  height: 100%;
}

.sidebar {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  height: fit-content;
  position: sticky;
  top: var(--spacing-4);
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.main {
  flex: 1;
  overflow-y: auto;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--color-text-muted);
  font-size: var(--text-lg);
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

.chartsContainer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.chartCard {
  position: relative;
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

.chartWrapper {
  position: relative;
  height: 400px;
}

.exportBtn {
  position: absolute;
  top: var(--spacing-3);
  right: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast);
  z-index: 10;
}

.chartCard:hover .exportBtn {
  opacity: 1;
}

.exportBtn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-border-emphasis);
}

.dataInfo {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

.dataInfo h4 {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-3);
}

.infoList {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-2) var(--spacing-4);
  font-size: var(--text-sm);
}

.infoList dt {
  color: var(--color-text-muted);
}

.infoList dd {
  color: var(--color-text-primary);
  font-weight: var(--font-medium);
}

@media (max-width: 1200px) {
  .container {
    grid-template-columns: 280px 1fr;
  }
}

@media (max-width: 1024px) {
  .container {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    position: static;
    max-height: none;
  }
}

@media (max-width: 768px) {
  .chartWrapper {
    height: 300px;
  }
}
```

### 4. Index Export

**`src/components/tabs/ComponentFactorEffects/index.ts`:**

```typescript
export { ComponentFactorEffectsTab } from './index'
```

---

## Acceptance Criteria

- [ ] Vital parameter dropdown populates from viz_index
- [ ] Component factor dropdown populates based on selected vital
- [ ] Comparison tags show all categories for selected factor
- [ ] Tag colors match chart line colors exactly
- [ ] Selecting/deselecting comparisons updates chart immediately
- [ ] Select All / Deselect All buttons work
- [ ] Time range slider filters chart data
- [ ] CI bands appear/disappear based on checkbox
- [ ] Base model (dashed line) appears/disappear based on checkbox
- [ ] Delta plot shows/hides based on checkbox
- [ ] Chart legend hides CI band entries
- [ ] SVG export works for both charts
- [ ] Data summary shows correct counts
- [ ] Cascading reset: changing vital resets factor and comparisons

---

## Notes for Agent

1. **Cascading State**: The store handles cascading resets. When vital changes, factor and comparisons reset automatically (see T-005).

2. **Legend Filtering**: The `filter` function in legend config hides CI band labels while keeping data visible.

3. **Chart Colors**: Comparison colors must match tag colors. Both use `CHART_COLORS` array in order.

4. **Interaction Mode**: `mode: 'index'` shows tooltips for all datasets at same x-value.

5. **Sticky Sidebar**: Has `max-height` with `overflow-y: auto` for long category lists.