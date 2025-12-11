# T-010: RBC Transfusions Tab

| Field | Value |
|-------|-------|
| **ID** | T-010 |
| **Title** | RBC Transfusions Tab |
| **Phase** | 5 - Tab Implementations |
| **Priority** | High |
| **Depends On** | T-004, T-006, T-007, T-008 |
| **Blocks** | T-013 |
| **Estimated Effort** | 4-5 hours |

---

## Objective

Implement the RBC Transfusions tab showing transfusion effect plots for multiple vital parameters simultaneously, with LOESS smoothing overlay and export functionality.

---

## Context

The RBC Transfusions tab in the legacy application:
- Allows selecting multiple vital parameters (toggle buttons)
- Shows paired plots: main effect + delta (change from baseline)
- Includes LOESS smoothing data overlay
- Provides time range control
- Supports SVG export per chart

This is `transfusions.js` (1,208 lines) in the legacy codebase.

---

## Requirements

### 1. Tab Container

**`src/components/tabs/RBCTransfusions/index.tsx`:**

```typescript
import { useEffect, useMemo, useCallback } from 'react'
import { useDashboardStore, selectTransfusionState } from '@/stores/dashboardStore'
import { 
  loadTransfusionData, 
  getLoessDataForVital,
  getAvailableVitalParams 
} from '@/services/dataService'
import { useAsyncData } from '@/hooks/useCSVData'
import { VitalParamButtons, TimeRangeSlider, DisplayOptions } from '@/components/controls'
import { PlotPair } from './PlotPair'
import type { VitalParamCode, TransfusionDataRow, LoessDataRow } from '@/types'
import styles from './RBCTransfusions.module.css'

export function RBCTransfusionsTab() {
  const {
    transfusionSelectedVitals,
    transfusionTimeRange,
    transfusionDisplayOptions,
    toggleTransfusionVital,
    setTransfusionTimeRange,
    setTransfusionDisplayOption,
    setAvailableVitals,
    availableVitals,
  } = useDashboardStore()
  
  // Load available vitals
  const { data: vitals } = useAsyncData(getAvailableVitalParams, [])
  
  useEffect(() => {
    if (vitals && vitals.length > 0) {
      setAvailableVitals(vitals)
      // Auto-select first vital if none selected
      if (transfusionSelectedVitals.length === 0) {
        toggleTransfusionVital(vitals[0])
      }
    }
  }, [vitals, setAvailableVitals, transfusionSelectedVitals.length, toggleTransfusionVital])
  
  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.controls}>
          <VitalParamButtons
            availableParams={availableVitals}
            selectedParams={transfusionSelectedVitals}
            onToggle={toggleTransfusionVital}
          />
          
          <TimeRangeSlider
            value={transfusionTimeRange}
            onChange={setTransfusionTimeRange}
            min={0}
            max={720}
            label="Time Range (minutes from transfusion)"
          />
          
          <DisplayOptions
            options={transfusionDisplayOptions}
            onChange={setTransfusionDisplayOption}
          />
        </div>
      </div>
      
      <div className={styles.main}>
        {transfusionSelectedVitals.length === 0 ? (
          <div className={styles.placeholder}>
            Select one or more vital parameters to view transfusion effects
          </div>
        ) : (
          <div className={styles.plotGrid}>
            {transfusionSelectedVitals.map(vital => (
              <TransfusionPlotPair
                key={vital}
                vitalParam={vital}
                timeRange={transfusionTimeRange}
                displayOptions={transfusionDisplayOptions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface TransfusionPlotPairProps {
  vitalParam: VitalParamCode
  timeRange: [number, number]
  displayOptions: {
    showConfidenceInterval: boolean
    showBaseModel: boolean
    showDeltaPlot: boolean
  }
}

function TransfusionPlotPair({ 
  vitalParam, 
  timeRange, 
  displayOptions 
}: TransfusionPlotPairProps) {
  const { data: transfusionData, loading: loadingTrans } = useAsyncData(
    () => loadTransfusionData(vitalParam),
    [vitalParam]
  )
  
  const { data: loessData, loading: loadingLoess } = useAsyncData(
    () => getLoessDataForVital(vitalParam),
    [vitalParam]
  )
  
  if (loadingTrans || loadingLoess) {
    return <div className={styles.loadingPlot}>Loading {vitalParam}...</div>
  }
  
  if (!transfusionData) {
    return <div className={styles.errorPlot}>Failed to load {vitalParam}</div>
  }
  
  return (
    <PlotPair
      vitalParam={vitalParam}
      transfusionData={transfusionData}
      loessData={loessData || []}
      timeRange={timeRange}
      displayOptions={displayOptions}
    />
  )
}
```

### 2. Plot Pair Component

**`src/components/tabs/RBCTransfusions/PlotPair.tsx`:**

```typescript
import { useRef, useCallback } from 'react'
import type { Chart as ChartInstance } from 'chart.js'
import { BaseChart, exportChartAsSVG, prepareTransfusionChartData } from '@/components/charts'
import { VITAL_PARAMS, type VitalParamCode, type TransfusionDataRow, type LoessDataRow } from '@/types'
import { useChartTheme, CHART_COLORS } from '@/hooks/useChartTheme'
import type { ChartData, ChartOptions } from 'chart.js'
import _ from 'lodash-es'
import styles from './RBCTransfusions.module.css'

interface PlotPairProps {
  vitalParam: VitalParamCode
  transfusionData: TransfusionDataRow[]
  loessData: LoessDataRow[]
  timeRange: [number, number]
  displayOptions: {
    showConfidenceInterval: boolean
    showBaseModel: boolean
    showDeltaPlot: boolean
  }
}

export function PlotPair({
  vitalParam,
  transfusionData,
  loessData,
  timeRange,
  displayOptions,
}: PlotPairProps) {
  const mainChartRef = useRef<ChartInstance | null>(null)
  const deltaChartRef = useRef<ChartInstance | null>(null)
  
  const vitalInfo = VITAL_PARAMS[vitalParam]
  const chartTheme = useChartTheme()
  
  // Filter by time range
  const filteredData = transfusionData.filter(
    row => row.TimeFromTransfusion >= timeRange[0] && row.TimeFromTransfusion <= timeRange[1]
  )
  const filteredLoess = loessData.filter(
    row => row.TimeFromTransfusion >= timeRange[0] && row.TimeFromTransfusion <= timeRange[1]
  )
  
  // Prepare main plot data
  const mainChartData = prepareMainPlotData(filteredData, filteredLoess, displayOptions)
  
  // Prepare delta plot data
  const deltaChartData = prepareDeltaPlotData(filteredData, displayOptions)
  
  // Chart options
  const mainOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: `${vitalInfo.name} - Transfusion Effect`,
        font: { size: 14, weight: 'bold' },
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
      y: {
        title: {
          display: true,
          text: vitalInfo.yAxisLabel,
        },
      },
    },
  }
  
  const deltaOptions: ChartOptions<'line'> = {
    ...mainOptions,
    plugins: {
      ...mainOptions.plugins,
      title: {
        display: true,
        text: `${vitalInfo.name} - Change from Baseline`,
        font: { size: 14, weight: 'bold' },
      },
    },
    scales: {
      ...mainOptions.scales,
      y: {
        title: {
          display: true,
          text: vitalInfo.deltaYAxisLabel,
        },
      },
    },
  }
  
  const handleExportMain = useCallback(() => {
    if (mainChartRef.current) {
      exportChartAsSVG(mainChartRef.current, `${vitalParam}_transfusion_effect.svg`)
    }
  }, [vitalParam])
  
  const handleExportDelta = useCallback(() => {
    if (deltaChartRef.current) {
      exportChartAsSVG(deltaChartRef.current, `${vitalParam}_transfusion_delta.svg`)
    }
  }, [vitalParam])
  
  return (
    <div className={styles.plotPair}>
      <div className={styles.plotContainer}>
        <BaseChart
          type="line"
          data={mainChartData}
          options={mainOptions}
          height={350}
          onChartReady={(chart) => { mainChartRef.current = chart }}
        />
        <button className={styles.exportBtn} onClick={handleExportMain}>
          Export SVG
        </button>
      </div>
      
      {displayOptions.showDeltaPlot && (
        <div className={styles.plotContainer}>
          <BaseChart
            type="line"
            data={deltaChartData}
            options={deltaOptions}
            height={350}
            onChartReady={(chart) => { deltaChartRef.current = chart }}
          />
          <button className={styles.exportBtn} onClick={handleExportDelta}>
            Export SVG
          </button>
        </div>
      )}
    </div>
  )
}

function prepareMainPlotData(
  data: TransfusionDataRow[],
  loess: LoessDataRow[],
  options: { showConfidenceInterval: boolean; showBaseModel: boolean }
): ChartData<'line'> {
  const sorted = _.sortBy(data, 'TimeFromTransfusion')
  const sortedLoess = _.sortBy(loess, 'TimeFromTransfusion')
  
  const datasets: ChartData<'line'>['datasets'] = []
  const mainColor = CHART_COLORS[0]
  const loessColor = CHART_COLORS[2]
  
  // CI bands
  if (options.showConfidenceInterval) {
    datasets.push({
      label: 'CI Lower',
      data: sorted.map(r => ({ x: r.TimeFromTransfusion, y: r.Lower_Full })),
      borderColor: 'transparent',
      backgroundColor: `${mainColor}20`,
      fill: 'origin',
      pointRadius: 0,
      tension: 0.3,
    })
    datasets.push({
      label: 'CI Upper',
      data: sorted.map(r => ({ x: r.TimeFromTransfusion, y: r.Upper_Full })),
      borderColor: 'transparent',
      backgroundColor: `${mainColor}20`,
      fill: '-1',
      pointRadius: 0,
      tension: 0.3,
    })
  }
  
  // Main line
  datasets.push({
    label: 'Adjusted Model',
    data: sorted.map(r => ({ x: r.TimeFromTransfusion, y: r.PredVal_Full })),
    borderColor: mainColor,
    backgroundColor: mainColor,
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.3,
  })
  
  // Base model
  if (options.showBaseModel) {
    datasets.push({
      label: 'Base Model',
      data: sorted.map(r => ({ x: r.TimeFromTransfusion, y: r.PredVal_Base })),
      borderColor: mainColor,
      borderWidth: 1,
      borderDash: [5, 5],
      pointRadius: 0,
      tension: 0.3,
    })
  }
  
  // LOESS
  if (sortedLoess.length > 0) {
    datasets.push({
      label: 'LOESS Smooth',
      data: sortedLoess.map(r => ({ x: r.TimeFromTransfusion, y: r.LoessSmooth })),
      borderColor: loessColor,
      backgroundColor: loessColor,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
    })
  }
  
  return { datasets }
}

function prepareDeltaPlotData(
  data: TransfusionDataRow[],
  options: { showConfidenceInterval: boolean; showBaseModel: boolean }
): ChartData<'line'> {
  const sorted = _.sortBy(data, 'TimeFromTransfusion')
  const datasets: ChartData<'line'>['datasets'] = []
  const mainColor = CHART_COLORS[0]
  
  if (options.showConfidenceInterval) {
    datasets.push({
      label: 'CI Lower',
      data: sorted.map(r => ({ x: r.TimeFromTransfusion, y: r.Delta_Lower })),
      borderColor: 'transparent',
      backgroundColor: `${mainColor}20`,
      fill: 'origin',
      pointRadius: 0,
      tension: 0.3,
    })
    datasets.push({
      label: 'CI Upper',
      data: sorted.map(r => ({ x: r.TimeFromTransfusion, y: r.Delta_Upper })),
      borderColor: 'transparent',
      backgroundColor: `${mainColor}20`,
      fill: '-1',
      pointRadius: 0,
      tension: 0.3,
    })
  }
  
  datasets.push({
    label: 'Adjusted Model',
    data: sorted.map(r => ({ x: r.TimeFromTransfusion, y: r.Delta_Full })),
    borderColor: mainColor,
    backgroundColor: mainColor,
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.3,
  })
  
  if (options.showBaseModel) {
    datasets.push({
      label: 'Base Model',
      data: sorted.map(r => ({ x: r.TimeFromTransfusion, y: r.Delta_Base })),
      borderColor: mainColor,
      borderWidth: 1,
      borderDash: [5, 5],
      pointRadius: 0,
      tension: 0.3,
    })
  }
  
  return { datasets }
}
```

### 3. Styles

**`src/components/tabs/RBCTransfusions/RBCTransfusions.module.css`:**

```css
.container {
  display: grid;
  grid-template-columns: 280px 1fr;
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
  height: 300px;
  color: var(--color-text-muted);
  font-size: var(--text-lg);
}

.plotGrid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.plotPair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

.plotContainer {
  position: relative;
  min-height: 350px;
}

.exportBtn {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.plotContainer:hover .exportBtn {
  opacity: 1;
}

.exportBtn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-border-emphasis);
}

.loadingPlot,
.errorPlot {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 350px;
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

.loadingPlot {
  color: var(--color-text-muted);
}

.errorPlot {
  color: var(--color-error);
}

@media (max-width: 1024px) {
  .container {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    position: static;
  }
  
  .plotPair {
    grid-template-columns: 1fr;
  }
}
```

### 4. Index Export

**`src/components/tabs/RBCTransfusions/index.ts`:**

```typescript
export { RBCTransfusionsTab } from './index'
```

---

## Acceptance Criteria

- [ ] Multiple vital parameters can be selected simultaneously
- [ ] Each vital shows paired plots (main + delta)
- [ ] LOESS smoothing line appears when data available
- [ ] Time range slider filters all visible charts
- [ ] Display options (CI, base model, delta) toggle correctly
- [ ] SVG export works for each chart individually
- [ ] Export button appears on hover
- [ ] Loading states show while data fetches
- [ ] Sidebar is sticky on desktop, stacks on mobile
- [ ] Vertical red line appears at t=0 on all charts

---

## Notes for Agent

1. **Multiple Charts**: Each selected vital creates a plot pair. Performance may degrade with all 7 selected.

2. **LOESS Data**: LOESS data may not exist for all vitals. Handle gracefully.

3. **Chart References**: Use refs to access Chart.js instances for SVG export.

4. **Responsive Grid**: `grid-template-columns: repeat(auto-fit, minmax(400px, 1fr))` creates 1-2 columns.

5. **Sticky Sidebar**: Uses `position: sticky` on desktop for persistent controls while scrolling.