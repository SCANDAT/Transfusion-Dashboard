# T-007: Base Chart Component

| Field | Value |
|-------|-------|
| **ID** | T-007 |
| **Title** | Base Chart Component |
| **Phase** | 4 - Core Components |
| **Priority** | High |
| **Depends On** | T-002, T-005 |
| **Blocks** | T-009, T-010, T-011, T-012 |
| **Estimated Effort** | 4-5 hours |

---

## Objective

Create a reusable Chart.js wrapper component with proper lifecycle management, theme integration, and export functionality. This eliminates memory leaks from chart instances.

---

## Context

The legacy application has:
- Chart.js 3.9.1 instances created manually
- Memory leaks from charts not being destroyed
- Theme detection duplicated across modules
- Custom vertical line plugin for t=0
- SVG export via FileSaver.js

---

## Requirements

### 1. Vertical Line Plugin

**`src/components/charts/plugins/verticalLinePlugin.ts`:**

```typescript
import { Plugin, Chart } from 'chart.js'
import { SCANDAT_RED } from '@/hooks/useChartTheme'

/**
 * Custom Chart.js plugin to draw a vertical line at x=0 (transfusion time)
 */
export const verticalLinePlugin: Plugin = {
  id: 'verticalLine',
  
  afterDraw: (chart: Chart) => {
    const xScale = chart.scales.x
    const yScale = chart.scales.y
    
    if (!xScale || !yScale) return
    
    const ctx = chart.ctx
    const xPos = xScale.getPixelForValue(0)
    
    // Only draw if 0 is within the visible range
    if (xPos < xScale.left || xPos > xScale.right) return
    
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(xPos, yScale.top)
    ctx.lineTo(xPos, yScale.bottom)
    ctx.lineWidth = 2
    ctx.strokeStyle = SCANDAT_RED
    ctx.stroke()
    ctx.restore()
  }
}
```

### 2. Chart Registration

**`src/components/charts/chartConfig.ts`:**

```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { verticalLinePlugin } from './plugins/verticalLinePlugin'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  verticalLinePlugin
)

export { ChartJS }
```

### 3. Base Chart Component

**`src/components/charts/BaseChart.tsx`:**

```typescript
import { useRef, useEffect, useCallback } from 'react'
import { Chart } from 'react-chartjs-2'
import type { ChartData, ChartOptions, ChartType, Chart as ChartInstance } from 'chart.js'
import { useChartTheme, CHART_COLORS } from '@/hooks/useChartTheme'
import { useDashboardStore, selectTheme } from '@/stores/dashboardStore'
import './chartConfig' // Register plugins
import styles from './BaseChart.module.css'

export interface BaseChartProps<T extends ChartType = 'line'> {
  type: T
  data: ChartData<T>
  options?: ChartOptions<T>
  height?: number | string
  className?: string
  showVerticalLine?: boolean
  onChartReady?: (chart: ChartInstance<T>) => void
}

export function BaseChart<T extends ChartType = 'line'>({
  type,
  data,
  options = {},
  height = 400,
  className,
  showVerticalLine = true,
  onChartReady,
}: BaseChartProps<T>) {
  const chartRef = useRef<ChartInstance<T> | null>(null)
  const theme = useDashboardStore(selectTheme)
  const chartTheme = useChartTheme()
  
  // Apply theme to options
  const themedOptions: ChartOptions<T> = {
    ...options,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...options.plugins,
      verticalLine: showVerticalLine ? {} : false,
      legend: {
        ...options.plugins?.legend,
        labels: {
          color: chartTheme.legendColor,
          font: { family: chartTheme.fontFamily },
          ...options.plugins?.legend?.labels,
        },
      },
      tooltip: {
        ...options.plugins?.tooltip,
        backgroundColor: chartTheme.tooltipBackground,
        titleColor: chartTheme.tooltipText,
        bodyColor: chartTheme.tooltipText,
      },
    },
    scales: {
      ...options.scales,
      x: {
        ...options.scales?.x,
        grid: {
          color: chartTheme.gridColor,
          ...options.scales?.x?.grid,
        },
        ticks: {
          color: chartTheme.tickColor,
          ...options.scales?.x?.ticks,
        },
      },
      y: {
        ...options.scales?.y,
        grid: {
          color: chartTheme.gridColor,
          ...options.scales?.y?.grid,
        },
        ticks: {
          color: chartTheme.tickColor,
          ...options.scales?.y?.ticks,
        },
      },
    },
  } as ChartOptions<T>
  
  // Notify parent when chart is ready
  useEffect(() => {
    if (chartRef.current && onChartReady) {
      onChartReady(chartRef.current)
    }
  }, [onChartReady])
  
  // Force update on theme change
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update()
    }
  }, [theme])
  
  return (
    <div 
      className={`${styles.container} ${className || ''}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <Chart
        ref={chartRef}
        type={type}
        data={data}
        options={themedOptions}
      />
    </div>
  )
}
```

**`src/components/charts/BaseChart.module.css`:**

```css
.container {
  position: relative;
  width: 100%;
}
```

### 4. SVG Export Utility

**`src/components/charts/exportChart.ts`:**

```typescript
import { saveAs } from 'file-saver'
import type { Chart as ChartInstance } from 'chart.js'

/**
 * Export a Chart.js chart as SVG
 * Temporarily switches to light theme for better print quality
 */
export async function exportChartAsSVG(
  chart: ChartInstance,
  filename: string = 'chart.svg'
): Promise<void> {
  const wasLightTheme = document.body.classList.contains('light-theme')
  
  // Temporarily switch to light theme for export
  if (!wasLightTheme) {
    document.body.classList.add('light-theme')
    chart.update()
    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  try {
    // Get base64 image from canvas
    const base64Image = chart.toBase64Image('image/png', 1)
    
    // Create SVG wrapper
    const canvas = chart.canvas
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', String(canvas.width))
    svg.setAttribute('height', String(canvas.height))
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    
    // Embed image in SVG
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
    image.setAttribute('width', String(canvas.width))
    image.setAttribute('height', String(canvas.height))
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', base64Image)
    svg.appendChild(image)
    
    // Serialize and save
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    
    saveAs(blob, filename)
  } finally {
    // Restore original theme
    if (!wasLightTheme) {
      document.body.classList.remove('light-theme')
      chart.update()
    }
  }
}
```

### 5. Chart Data Preparation Utilities

**`src/components/charts/prepareChartData.ts`:**

```typescript
import type { ChartData, ChartDataset } from 'chart.js'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import type { 
  VisualizationDataRow, 
  TransfusionDataRow,
  TimeRange,
  ChartDisplayOptions 
} from '@/types'
import _ from 'lodash-es'

interface Point {
  x: number
  y: number
}

/**
 * Filter data rows by time range
 */
export function filterByTimeRange<T extends { TimeFromTransfusion: number }>(
  rows: T[],
  timeRange: TimeRange
): T[] {
  const [min, max] = timeRange
  return rows.filter(row => 
    row.TimeFromTransfusion >= min && row.TimeFromTransfusion <= max
  )
}

/**
 * Prepare visualization chart data (Component Factor Effects tab)
 */
export function prepareVisualizationChartData(
  rows: VisualizationDataRow[],
  comparisonColumn: string,
  selectedComparisons: (string | number)[],
  timeRange: TimeRange,
  displayOptions: ChartDisplayOptions
): ChartData<'line'> {
  // Filter by time range
  const filteredRows = filterByTimeRange(rows, timeRange)
  
  // Group by comparison value
  const grouped = _.groupBy(filteredRows, comparisonColumn)
  
  const datasets: ChartDataset<'line'>[] = []
  let colorIndex = 0
  
  for (const [compValue, groupRows] of Object.entries(grouped)) {
    // Skip if not selected
    const numericValue = Number(compValue)
    const compareValue = isNaN(numericValue) ? compValue : numericValue
    
    if (!selectedComparisons.includes(compareValue)) continue
    
    const color = CHART_COLORS[colorIndex % CHART_COLORS.length]
    const sortedRows = _.sortBy(groupRows, 'TimeFromTransfusion')
    
    // Determine which value field to use
    const valueField = displayOptions.showDeltaPlot ? 'Delta_Full' : 'PredVal_Full'
    const lowerField = displayOptions.showDeltaPlot ? 'Delta_Lower' : 'Lower_Full'
    const upperField = displayOptions.showDeltaPlot ? 'Delta_Upper' : 'Upper_Full'
    
    // Add confidence interval bands if enabled
    if (displayOptions.showConfidenceInterval) {
      // Lower CI band
      datasets.push({
        label: `${compValue} (CI lower)`,
        data: sortedRows.map(row => ({ 
          x: row.TimeFromTransfusion, 
          y: row[lowerField] 
        })),
        borderColor: 'transparent',
        backgroundColor: `${color}20`,
        fill: 'origin',
        pointRadius: 0,
        tension: 0.3,
        order: 2,
      })
      
      // Upper CI band (fills to previous dataset)
      datasets.push({
        label: `${compValue} (CI upper)`,
        data: sortedRows.map(row => ({ 
          x: row.TimeFromTransfusion, 
          y: row[upperField] 
        })),
        borderColor: 'transparent',
        backgroundColor: `${color}20`,
        fill: '-1',
        pointRadius: 0,
        tension: 0.3,
        order: 1,
      })
    }
    
    // Main line
    datasets.push({
      label: String(compValue),
      data: sortedRows.map(row => ({ 
        x: row.TimeFromTransfusion, 
        y: row[valueField] 
      })),
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
      order: 0,
    })
    
    // Base model line if enabled
    if (displayOptions.showBaseModel) {
      const baseField = displayOptions.showDeltaPlot ? 'Delta_Base' : 'PredVal_Base'
      datasets.push({
        label: `${compValue} (base)`,
        data: sortedRows.map(row => ({ 
          x: row.TimeFromTransfusion, 
          y: row[baseField] 
        })),
        borderColor: color,
        backgroundColor: color,
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.3,
        order: 0,
      })
    }
    
    colorIndex++
  }
  
  return { datasets }
}

/**
 * Prepare transfusion effect chart data (RBC Transfusions tab)
 */
export function prepareTransfusionChartData(
  rows: TransfusionDataRow[],
  timeRange: TimeRange,
  displayOptions: ChartDisplayOptions
): ChartData<'line'> {
  const filteredRows = filterByTimeRange(rows, timeRange)
  const sortedRows = _.sortBy(filteredRows, 'TimeFromTransfusion')
  
  const datasets: ChartDataset<'line'>[] = []
  const color = CHART_COLORS[0]
  
  const valueField = displayOptions.showDeltaPlot ? 'Delta_Full' : 'PredVal_Full'
  const lowerField = displayOptions.showDeltaPlot ? 'Delta_Lower' : 'Lower_Full'
  const upperField = displayOptions.showDeltaPlot ? 'Delta_Upper' : 'Upper_Full'
  
  if (displayOptions.showConfidenceInterval) {
    datasets.push({
      label: 'CI lower',
      data: sortedRows.map(row => ({ x: row.TimeFromTransfusion, y: row[lowerField] })),
      borderColor: 'transparent',
      backgroundColor: `${color}20`,
      fill: 'origin',
      pointRadius: 0,
      tension: 0.3,
    })
    
    datasets.push({
      label: 'CI upper',
      data: sortedRows.map(row => ({ x: row.TimeFromTransfusion, y: row[upperField] })),
      borderColor: 'transparent',
      backgroundColor: `${color}20`,
      fill: '-1',
      pointRadius: 0,
      tension: 0.3,
    })
  }
  
  datasets.push({
    label: 'Adjusted Model',
    data: sortedRows.map(row => ({ x: row.TimeFromTransfusion, y: row[valueField] })),
    borderColor: color,
    backgroundColor: color,
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.3,
  })
  
  if (displayOptions.showBaseModel) {
    const baseField = displayOptions.showDeltaPlot ? 'Delta_Base' : 'PredVal_Base'
    datasets.push({
      label: 'Base Model',
      data: sortedRows.map(row => ({ x: row.TimeFromTransfusion, y: row[baseField] })),
      borderColor: color,
      borderWidth: 1,
      borderDash: [5, 5],
      pointRadius: 0,
      tension: 0.3,
    })
  }
  
  return { datasets }
}
```

### 6. Index Export

**`src/components/charts/index.ts`:**

```typescript
export { BaseChart } from './BaseChart'
export type { BaseChartProps } from './BaseChart'
export { exportChartAsSVG } from './exportChart'
export { 
  prepareVisualizationChartData, 
  prepareTransfusionChartData,
  filterByTimeRange 
} from './prepareChartData'
export { verticalLinePlugin } from './plugins/verticalLinePlugin'
```

---

## Acceptance Criteria

- [ ] BaseChart renders correctly with theme colors
- [ ] Chart updates when theme changes (no stale colors)
- [ ] Vertical red line appears at x=0
- [ ] Confidence interval bands render correctly
- [ ] SVG export produces valid SVG file
- [ ] SVG export uses light theme regardless of current theme
- [ ] No Chart.js console warnings
- [ ] Chart resizes responsively
- [ ] `prepareVisualizationChartData` handles all display options
- [ ] `prepareTransfusionChartData` handles all display options

---

## Notes for Agent

1. **Chart.js Version**: Must use Chart.js 3.9.1. The `react-chartjs-2` package wraps this.

2. **Plugin Registration**: Plugins must be registered globally before use.

3. **Memory Management**: `react-chartjs-2` handles chart destruction automatically.

4. **Tension**: The `tension: 0.3` creates smooth curves matching legacy charts.

5. **Fill Order**: CI bands use `fill: '-1'` to fill to previous dataset. Order matters.