# T-009: Main Findings Tab

| Field | Value |
|-------|-------|
| **ID** | T-009 |
| **Title** | Main Findings Tab |
| **Phase** | 5 - Tab Implementations |
| **Priority** | High |
| **Depends On** | T-004, T-006, T-007 |
| **Blocks** | T-013 |
| **Estimated Effort** | 4-5 hours |

---

## Objective

Implement the Main Findings tab displaying summary tables (Table 2a, Table 2b) and a small multiples grid showing all vital × factor combinations.

---

## Context

The Main Findings tab in the legacy application shows:
1. **Table 2a**: Observed and model-based summaries for each vital parameter
2. **Table 2b**: Factor-specific effects summary
3. **Small Multiples Grid**: 7 vitals × 5 factors = 35 mini-charts

This is the default landing tab providing an overview of the research findings.

---

## Requirements

### 1. Tab Container

**`src/components/tabs/MainFindings/index.tsx`:**

```typescript
import { useEffect } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { 
  loadObservedDataSummary, 
  loadModelBasedSummary,
  loadFactorObservedSummary,
  loadFactorModelSummary,
  loadVizIndex 
} from '@/services/dataService'
import { useAsyncData } from '@/hooks/useCSVData'
import { SummaryTableA } from './SummaryTableA'
import { SummaryTableB } from './SummaryTableB'
import { SmallMultiplesGrid } from './SmallMultiplesGrid'
import styles from './MainFindings.module.css'

export function MainFindingsTab() {
  const { setLoading, setError } = useDashboardStore()
  
  const { data: observedSummary, loading: loadingObserved } = useAsyncData(
    loadObservedDataSummary, []
  )
  
  const { data: modelSummary, loading: loadingModel } = useAsyncData(
    loadModelBasedSummary, []
  )
  
  const { data: factorObserved, loading: loadingFactorObs } = useAsyncData(
    loadFactorObservedSummary, []
  )
  
  const { data: factorModel, loading: loadingFactorModel } = useAsyncData(
    loadFactorModelSummary, []
  )
  
  const { data: vizIndex, loading: loadingIndex } = useAsyncData(
    loadVizIndex, []
  )
  
  const isLoading = loadingObserved || loadingModel || loadingFactorObs || 
                    loadingFactorModel || loadingIndex
  
  useEffect(() => {
    setLoading(isLoading)
  }, [isLoading, setLoading])
  
  if (isLoading) {
    return <div className={styles.loading}>Loading main findings...</div>
  }
  
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Table 2a: Vital Parameter Summary</h2>
        <p className={styles.sectionDesc}>
          Pre- and post-transfusion vital signs with model-based estimates
        </p>
        {observedSummary && modelSummary && (
          <SummaryTableA 
            observedData={observedSummary} 
            modelData={modelSummary} 
          />
        )}
      </section>
      
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Table 2b: Component Factor Effects</h2>
        <p className={styles.sectionDesc}>
          Effect estimates by RBC component characteristics
        </p>
        {factorObserved && factorModel && (
          <SummaryTableB 
            observedData={factorObserved} 
            modelData={factorModel} 
          />
        )}
      </section>
      
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Effect Overview</h2>
        <p className={styles.sectionDesc}>
          Small multiples showing all vital parameter × component factor combinations
        </p>
        {vizIndex && <SmallMultiplesGrid vizIndex={vizIndex} />}
      </section>
    </div>
  )
}
```

### 2. Summary Table A (Table 2a)

**`src/components/tabs/MainFindings/SummaryTableA.tsx`:**

```typescript
import type { ObservedDataSummaryRow, ModelBasedSummaryRow } from '@/types'
import { VITAL_PARAMS } from '@/types'
import styles from './MainFindings.module.css'

interface SummaryTableAProps {
  observedData: ObservedDataSummaryRow[]
  modelData: ModelBasedSummaryRow[]
}

export function SummaryTableA({ observedData, modelData }: SummaryTableAProps) {
  // Merge observed and model data by VitalParam
  const mergedData = observedData.map(obs => {
    const model = modelData.find(m => m.VitalParam === obs.VitalParam)
    return { observed: obs, model }
  })
  
  const formatValue = (val: number, decimals = 1) => val.toFixed(decimals)
  const formatCI = (lower: number, upper: number) => 
    `[${formatValue(lower)}, ${formatValue(upper)}]`
  
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th rowSpan={2}>Vital Parameter</th>
            <th colSpan={2}>Pre-Transfusion</th>
            <th colSpan={2}>Post-Transfusion</th>
            <th colSpan={2}>Change</th>
            <th colSpan={2}>Model Estimate (Base)</th>
            <th colSpan={2}>Model Estimate (Adjusted)</th>
          </tr>
          <tr>
            <th>Mean</th>
            <th>SD</th>
            <th>Mean</th>
            <th>SD</th>
            <th>Mean</th>
            <th>SD</th>
            <th>Est (SE)</th>
            <th>95% CI</th>
            <th>Est (SE)</th>
            <th>95% CI</th>
          </tr>
        </thead>
        <tbody>
          {mergedData.map(({ observed, model }) => (
            <tr key={observed.VitalParam}>
              <td className={styles.vitalName}>
                {VITAL_PARAMS[observed.VitalParam]?.name || observed.VitalName}
              </td>
              <td>{formatValue(observed.PreTransfusion_Mean)}</td>
              <td>{formatValue(observed.PreTransfusion_SD)}</td>
              <td>{formatValue(observed.PostTransfusion_Mean)}</td>
              <td>{formatValue(observed.PostTransfusion_SD)}</td>
              <td>{formatValue(observed.Change_Mean)}</td>
              <td>{formatValue(observed.Change_SD)}</td>
              {model ? (
                <>
                  <td>{formatValue(model.Base_Estimate)} ({formatValue(model.Base_StdErr)})</td>
                  <td>{formatCI(model.Base_Lower, model.Base_Upper)}</td>
                  <td>{formatValue(model.Full_Estimate)} ({formatValue(model.Full_StdErr)})</td>
                  <td>{formatCI(model.Full_Lower, model.Full_Upper)}</td>
                </>
              ) : (
                <>
                  <td colSpan={4}>—</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### 3. Summary Table B (Table 2b)

**`src/components/tabs/MainFindings/SummaryTableB.tsx`:**

```typescript
import { useMemo } from 'react'
import type { FactorSummaryRow } from '@/types'
import { VITAL_PARAMS, COMP_FACTORS } from '@/types'
import styles from './MainFindings.module.css'

interface SummaryTableBProps {
  observedData: FactorSummaryRow[]
  modelData: FactorSummaryRow[]
}

export function SummaryTableB({ observedData, modelData }: SummaryTableBProps) {
  // Group by CompFactor, then by VitalParam
  const groupedData = useMemo(() => {
    const groups: Record<string, {
      factor: string
      vitals: Record<string, {
        categories: FactorSummaryRow[]
      }>
    }> = {}
    
    for (const row of modelData) {
      if (!groups[row.CompFactor]) {
        groups[row.CompFactor] = {
          factor: COMP_FACTORS[row.CompFactor]?.name || row.CompFactor,
          vitals: {}
        }
      }
      if (!groups[row.CompFactor].vitals[row.VitalParam]) {
        groups[row.CompFactor].vitals[row.VitalParam] = { categories: [] }
      }
      groups[row.CompFactor].vitals[row.VitalParam].categories.push(row)
    }
    
    return groups
  }, [modelData])
  
  const formatValue = (val: number) => val.toFixed(2)
  const formatCI = (lower: number, upper: number) => 
    `[${formatValue(lower)}, ${formatValue(upper)}]`
  
  return (
    <div className={styles.tableWrapper}>
      {Object.entries(groupedData).map(([factorCode, factorData]) => (
        <div key={factorCode} className={styles.factorSection}>
          <h3 className={styles.factorTitle}>{factorData.factor}</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                {Object.keys(factorData.vitals).map(vitalCode => (
                  <th key={vitalCode}>
                    {VITAL_PARAMS[vitalCode as keyof typeof VITAL_PARAMS]?.displayName || vitalCode}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Get all unique categories
                const allCategories = new Set<string>()
                Object.values(factorData.vitals).forEach(v => 
                  v.categories.forEach(c => allCategories.add(c.CategoryLabel))
                )
                
                return Array.from(allCategories).map(category => (
                  <tr key={category}>
                    <td className={styles.categoryLabel}>{category}</td>
                    {Object.entries(factorData.vitals).map(([vitalCode, vitalData]) => {
                      const catData = vitalData.categories.find(c => c.CategoryLabel === category)
                      return (
                        <td key={vitalCode}>
                          {catData ? (
                            <span className={styles.estimate}>
                              {formatValue(catData.Estimate)}
                              <span className={styles.ci}>
                                {formatCI(catData.Lower, catData.Upper)}
                              </span>
                            </span>
                          ) : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
```

### 4. Small Multiples Grid

**`src/components/tabs/MainFindings/SmallMultiplesGrid.tsx`:**

```typescript
import { useState, useMemo } from 'react'
import type { VizIndexEntry, VitalParamCode, CompFactorCode } from '@/types'
import { VITAL_PARAMS, COMP_FACTORS, VITAL_PARAM_CODES, COMP_FACTOR_CODES } from '@/types'
import { SmallMultipleChart } from './SmallMultipleChart'
import styles from './MainFindings.module.css'

interface SmallMultiplesGridProps {
  vizIndex: VizIndexEntry[]
}

export function SmallMultiplesGrid({ vizIndex }: SmallMultiplesGridProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  
  // Create a lookup map for quick access
  const indexMap = useMemo(() => {
    const map = new Map<string, VizIndexEntry>()
    vizIndex.forEach(entry => {
      map.set(`${entry.VitalParam}_${entry.CompFactor}`, entry)
    })
    return map
  }, [vizIndex])
  
  return (
    <div className={styles.gridContainer}>
      {/* Header row with factor names */}
      <div className={styles.gridHeader}>
        <div className={styles.gridCorner} />
        {COMP_FACTOR_CODES.map(factor => (
          <div key={factor} className={styles.gridHeaderCell}>
            {COMP_FACTORS[factor].displayName}
          </div>
        ))}
      </div>
      
      {/* Data rows */}
      {VITAL_PARAM_CODES.map(vital => (
        <div key={vital} className={styles.gridRow}>
          <div className={styles.gridRowHeader}>
            {VITAL_PARAMS[vital].displayName}
          </div>
          {COMP_FACTOR_CODES.map(factor => {
            const key = `${vital}_${factor}`
            const entry = indexMap.get(key)
            const isHovered = hoveredCell === key
            
            return (
              <div 
                key={key} 
                className={`${styles.gridCell} ${isHovered ? styles.gridCellHovered : ''}`}
                onMouseEnter={() => setHoveredCell(key)}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {entry ? (
                  <SmallMultipleChart
                    vitalParam={vital}
                    compFactor={factor}
                    fileName={entry.FileName}
                    isHovered={isHovered}
                  />
                ) : (
                  <div className={styles.noData}>—</div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
```

### 5. Small Multiple Chart

**`src/components/tabs/MainFindings/SmallMultipleChart.tsx`:**

```typescript
import { useEffect, useState } from 'react'
import { loadVisualizationData } from '@/services/dataService'
import { BaseChart } from '@/components/charts'
import type { VitalParamCode, CompFactorCode, VisualizationData } from '@/types'
import type { ChartData, ChartOptions } from 'chart.js'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import _ from 'lodash-es'
import styles from './MainFindings.module.css'

interface SmallMultipleChartProps {
  vitalParam: VitalParamCode
  compFactor: CompFactorCode
  fileName: string
  isHovered: boolean
}

export function SmallMultipleChart({
  vitalParam,
  compFactor,
  fileName,
  isHovered,
}: SmallMultipleChartProps) {
  const [data, setData] = useState<VisualizationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    loadVisualizationData(vitalParam, compFactor)
      .then(setData)
      .catch(err => setError(err.message))
  }, [vitalParam, compFactor])
  
  if (error) {
    return <div className={styles.miniError}>!</div>
  }
  
  if (!data) {
    return <div className={styles.miniLoading} />
  }
  
  // Prepare simplified chart data (just main lines, no CI)
  const chartData: ChartData<'line'> = {
    datasets: data.comparisonValues.slice(0, 4).map((compValue, index) => {
      const rows = data.rows.filter(r => 
        r[data.comparisonColumn as keyof typeof r] === compValue
      )
      const sorted = _.sortBy(rows, 'TimeFromTransfusion')
      
      return {
        label: String(compValue),
        data: sorted.map(r => ({ x: r.TimeFromTransfusion, y: r.Delta_Full })),
        borderColor: CHART_COLORS[index],
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
      }
    })
  }
  
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: isHovered },
    },
    scales: {
      x: {
        display: false,
        min: 0,
        max: 720,
      },
      y: {
        display: false,
      },
    },
  }
  
  return (
    <div className={styles.miniChart}>
      <BaseChart
        type="line"
        data={chartData}
        options={chartOptions}
        height={60}
        showVerticalLine={false}
      />
    </div>
  )
}
```

### 6. Styles

**`src/components/tabs/MainFindings/MainFindings.module.css`:**

```css
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
  max-width: var(--container-xl);
  margin: 0 auto;
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.sectionTitle {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.sectionDesc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--color-text-muted);
}

/* Tables */
.tableWrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.table th,
.table td {
  padding: var(--spacing-2) var(--spacing-3);
  text-align: left;
  border-bottom: 1px solid var(--color-border-default);
}

.table th {
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-elevated);
  white-space: nowrap;
}

.table td {
  color: var(--color-text-primary);
}

.vitalName {
  font-weight: var(--font-medium);
}

.factorSection {
  margin-bottom: var(--spacing-6);
}

.factorTitle {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-3);
}

.categoryLabel {
  font-weight: var(--font-medium);
  white-space: nowrap;
}

.estimate {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ci {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

/* Small Multiples Grid */
.gridContainer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background-color: var(--color-border-default);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.gridHeader {
  display: grid;
  grid-template-columns: 80px repeat(5, 1fr);
  gap: 1px;
}

.gridCorner {
  background-color: var(--color-bg-card);
}

.gridHeaderCell {
  padding: var(--spacing-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-align: center;
  color: var(--color-text-secondary);
  background-color: var(--color-bg-elevated);
}

.gridRow {
  display: grid;
  grid-template-columns: 80px repeat(5, 1fr);
  gap: 1px;
}

.gridRowHeader {
  display: flex;
  align-items: center;
  padding: var(--spacing-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-elevated);
}

.gridCell {
  position: relative;
  background-color: var(--color-bg-card);
  padding: var(--spacing-1);
  min-height: 70px;
  transition: background-color var(--transition-fast);
}

.gridCellHovered {
  background-color: var(--color-bg-elevated);
}

.noData {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
}

.miniChart {
  width: 100%;
  height: 60px;
}

.miniLoading {
  width: 100%;
  height: 60px;
  background: linear-gradient(90deg, var(--color-bg-elevated) 25%, var(--color-bg-card) 50%, var(--color-bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.miniError {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  color: var(--color-error);
  font-weight: var(--font-semibold);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@media (max-width: 1024px) {
  .gridContainer {
    overflow-x: auto;
  }
  
  .gridHeader,
  .gridRow {
    min-width: 700px;
  }
}
```

### 7. Index Export

**`src/components/tabs/MainFindings/index.ts`:**

```typescript
export { MainFindingsTab } from './index'
```

---

## Acceptance Criteria

- [ ] Table 2a displays all vital parameters with observed and model data
- [ ] Table 2b displays factor-specific effects grouped by component factor
- [ ] Small multiples grid shows 35 mini-charts (7 vitals × 5 factors)
- [ ] Grid cells show loading shimmer while data loads
- [ ] Hover on grid cell shows tooltip
- [ ] Tables are horizontally scrollable on mobile
- [ ] All numeric values formatted consistently (1-2 decimal places)
- [ ] Error states handled gracefully

---

## Notes for Agent

1. **Data Dependencies**: This tab loads 4+ CSV files. Use parallel loading via `Promise.all`.

2. **Small Multiples Performance**: 35 charts can be slow. Consider lazy loading or virtualization if performance is poor.

3. **Table Structure**: Tables have complex headers with row/col spans. Match legacy structure exactly.

4. **Grid Layout**: CSS Grid handles the small multiples layout. Fixed column widths ensure alignment.

5. **Responsive**: Tables scroll horizontally on small screens; grid has minimum width.