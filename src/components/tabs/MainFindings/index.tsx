import { useEffect, useMemo, useState } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'
import {
  loadVizIndex,
  loadVitalSummary,
  loadModelVitalSummary,
  loadFactorObservedSummary,
  loadFactorModelSummary,
} from '@/services/dataService'
import { useAsyncData } from '@/hooks/useCSVData'
import { BaseChart } from '@/components/charts'
import { VITAL_PARAMS } from '@/types'
import type { ModelVitalSummaryRow, VitalSummaryRow } from '@/types'
import type { ChartData, ChartOptions } from 'chart.js'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import { SummaryTableA } from './SummaryTableA'
import { SummaryTableB, SingleFactorTable, useGroupedFactorData } from './SummaryTableB'
import { VirtualizedGrid } from './VirtualizedGrid'
import { AllFactorForestPlots, FactorForestPlot } from './FactorForestPlot'
import { VITAL_PARAM_CODES } from '@/types'
import styles from './MainFindings.module.css'

type ViewMode = 'table' | 'chart' | 'both'

// Help icon component
function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function MainFindingsTab() {
  const setLoading = useDashboardStore(state => state.setLoading)
  const setError = useDashboardStore(state => state.setError)

  // Load all required data
  const { data: vizIndex, loading: loadingIndex, error: indexError } = useAsyncData(loadVizIndex, [])
  const { data: vitalSummary, loading: loadingVital } = useAsyncData(loadVitalSummary, [])
  const { data: modelVitalSummary, loading: loadingModelVital } = useAsyncData(loadModelVitalSummary, [])
  const { data: factorObserved, loading: loadingFactorObs } = useAsyncData(loadFactorObservedSummary, [])
  const { data: factorModel, loading: loadingFactorModel } = useAsyncData(loadFactorModelSummary, [])

  const isLoading = loadingIndex || loadingVital || loadingModelVital || loadingFactorObs || loadingFactorModel

  useEffect(() => {
    setLoading(isLoading)
  }, [isLoading, setLoading])

  useEffect(() => {
    if (indexError) {
      setError(indexError.message)
    }
  }, [indexError, setError])

  // Create summary statistics
  const summaryStats = useMemo(() => {
    if (!vizIndex) return null

    const vitalParams = [...new Set(vizIndex.map(row => row.VitalParam))]
    const compFactors = [...new Set(vizIndex.map(row => row.CompFactor))]

    return {
      totalVitals: vitalParams.length,
      totalFactors: compFactors.length,
      totalCombinations: vizIndex.length,
      vitalParams,
      compFactors,
    }
  }, [vizIndex])

  if (isLoading) {
    return (
      <div className={styles.loading}>
        Loading main findings...
      </div>
    )
  }

  if (!vizIndex) {
    return (
      <div className={styles.error}>
        Failed to load data. Please refresh the page.
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <section className={styles.hero}>
        <h2 className={styles.title}>Key Results</h2>
        <p className={styles.description}>
          This section presents the main statistical findings from our analysis. We examined how seven
          vital parameters change in the 12 hours following RBC transfusion, and whether blood component
          characteristics influence these trajectories.
        </p>
      </section>

      {/* How to Read This Section */}
      <section className={styles.guideSection}>
        <div className={styles.guideHeader}>
          <HelpIcon />
          <h3>How to Interpret These Results</h3>
        </div>
        <div className={styles.guideContent}>
          <div className={styles.guideItem}>
            <strong>Positive values</strong> indicate the vital parameter <em>increased</em> after transfusion
          </div>
          <div className={styles.guideItem}>
            <strong>Negative values</strong> indicate the vital parameter <em>decreased</em> after transfusion
          </div>
          <div className={styles.guideItem}>
            <strong>95% Confidence Intervals</strong> show the range of plausible values — if this range
            doesn't cross zero, the effect is statistically significant
          </div>
          <div className={styles.guideItem}>
            <strong>Adjusted Model</strong> accounts for patient factors and concurrent treatments,
            giving a cleaner estimate of transfusion effects
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      {summaryStats && (
        <section className={styles.summarySection}>
          <div className={styles.summaryGrid}>
            <SummaryCard
              label="Vital Parameters"
              value={summaryStats.totalVitals}
              description="Physiological measures analyzed"
            />
            <SummaryCard
              label="Component Factors"
              value={summaryStats.totalFactors}
              description="Blood characteristics examined"
            />
            <SummaryCard
              label="Visualizations"
              value={summaryStats.totalCombinations}
              description="Parameter-factor combinations"
            />
            <SummaryCard
              label="Observation Window"
              value="±12h"
              description="Hours around transfusion"
            />
          </div>
        </section>
      )}

      {/* Table 2a: Vital Parameter Summary */}
      {vitalSummary && modelVitalSummary && (
        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Table 2a: Overall Transfusion Effects</h2>
              <p className={styles.sectionDescription}>
                How each vital parameter changes on average following transfusion. Compare observed
                (raw) values with model-adjusted estimates that account for confounding factors.
              </p>
            </div>
          </div>
          <div className={styles.interpretationHint}>
            <strong>Key insight:</strong> Heart rate tends to decrease slightly after transfusion
            (improved oxygen delivery reduces cardiac workload), while blood pressure shows a modest increase.
          </div>
          <SummaryTableA observedData={vitalSummary} modelData={modelVitalSummary} />
        </section>
      )}

      {/* Model Summary Chart */}
      {modelVitalSummary && vitalSummary && (
        <section className={styles.chartSection}>
          <h2 className={styles.sectionTitle}>Effect Size Comparison</h2>
          <p className={styles.sectionDescription}>
            Visual comparison of effect estimates across vital parameters. Bars extending
            from the zero line show the direction and magnitude of change.
          </p>
          <ModelSummaryChart modelData={modelVitalSummary} observedData={vitalSummary} />
        </section>
      )}

      {/* Small Multiples Grid */}
      <section className={styles.gridSection}>
        <h2 className={styles.sectionTitle}>Trajectory Overview Grid</h2>
        <p className={styles.sectionDescription}>
          Each cell shows a LOESS-smoothed trajectory of a vital parameter over time, stratified
          by a component factor. The curves represent average trends; hover for details.
          Click any cell to explore the full interactive visualization.
        </p>
        <div className={styles.gridLegend}>
          <span>Rows: Vital parameters</span>
          <span>Columns: Component factors</span>
          <span>Colors: Factor categories</span>
        </div>
        <VirtualizedGrid vizIndex={vizIndex} />
      </section>

      {/* Table 2b: Component Factor Effects */}
      {factorObserved && factorModel && (
        <FactorEffectsSection
          factorObserved={factorObserved}
          factorModel={factorModel}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string
  value: string | number
  description: string
}) {
  return (
    <div className={styles.summaryCard}>
      <span className={styles.summaryValue}>{value}</span>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryDesc}>{description}</span>
    </div>
  )
}

function ModelSummaryChart({ modelData, observedData }: { modelData: ModelVitalSummaryRow[], observedData: VitalSummaryRow[] }) {
  // Merge data by abbreviation to ensure alignment (case-insensitive comparison)
  const mergedData = modelData.map(model => {
    const observed = observedData.find(obs =>
      obs.Abbreviation.toUpperCase() === model.Abbreviation.toUpperCase()
    )
    return { model, observed }
  })

  // Store CI data for the error bar plugin
  const errorBars = {
    observed: mergedData.map(({ observed }) =>
      observed ? { lower: observed.Diff_LCL, upper: observed.Diff_UCL } : { lower: 0, upper: 0 }
    ),
    base: mergedData.map(({ model }) => ({ lower: model.Base_Diff_LCL, upper: model.Base_Diff_UCL })),
    full: mergedData.map(({ model }) => ({ lower: model.Full_Diff_LCL, upper: model.Full_Diff_UCL })),
  }

  // Calculate y-axis range to include all confidence intervals
  const allLower = [
    ...errorBars.observed.map(e => e.lower),
    ...errorBars.base.map(e => e.lower),
    ...errorBars.full.map(e => e.lower)
  ]
  const allUpper = [
    ...errorBars.observed.map(e => e.upper),
    ...errorBars.base.map(e => e.upper),
    ...errorBars.full.map(e => e.upper)
  ]
  const minY = Math.min(...allLower)
  const maxY = Math.max(...allUpper)
  const padding = (maxY - minY) * 0.1 // 10% padding

  const chartData: ChartData<'bar'> = {
    labels: mergedData.map(({ model }) => VITAL_PARAMS[model.Abbreviation]?.shortName || model.Abbreviation),
    datasets: [
      {
        label: 'Observed',
        data: mergedData.map(({ observed }) => observed?.Diff_Mean ?? 0),
        backgroundColor: CHART_COLORS[2] + '70',
        borderColor: CHART_COLORS[2],
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Base Model',
        data: mergedData.map(({ model }) => model.Base_Diff),
        backgroundColor: CHART_COLORS[0] + '70',
        borderColor: CHART_COLORS[0],
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Fully Adjusted Model',
        data: mergedData.map(({ model }) => model.Full_Diff),
        backgroundColor: CHART_COLORS[1] + '70',
        borderColor: CHART_COLORS[1],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  // Custom plugin to draw error bars
  const errorBarPlugin = {
    id: 'errorBars',
    afterDatasetsDraw(chart: import('chart.js').Chart) {
      const { ctx, scales } = chart
      const yScale = scales.y
      if (!yScale) return

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex)
        if (meta.hidden) return

        const errors = datasetIndex === 0 ? errorBars.observed : datasetIndex === 1 ? errorBars.base : errorBars.full
        const color = dataset.borderColor as string

        meta.data.forEach((bar, index) => {
          const error = errors[index]
          if (!error || (error.lower === 0 && error.upper === 0)) return

          const x = bar.x
          const yLower = yScale.getPixelForValue(error.lower)
          const yUpper = yScale.getPixelForValue(error.upper)
          const capWidth = 4

          ctx.save()
          ctx.strokeStyle = color
          ctx.lineWidth = 1.5

          // Vertical line
          ctx.beginPath()
          ctx.moveTo(x, yLower)
          ctx.lineTo(x, yUpper)
          ctx.stroke()

          // Top cap
          ctx.beginPath()
          ctx.moveTo(x - capWidth, yUpper)
          ctx.lineTo(x + capWidth, yUpper)
          ctx.stroke()

          // Bottom cap
          ctx.beginPath()
          ctx.moveTo(x - capWidth, yLower)
          ctx.lineTo(x + capWidth, yLower)
          ctx.stroke()

          ctx.restore()
        })
      })
    },
  }

  const chartOptions: ChartOptions<'bar'> = {
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
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const item = mergedData[context.dataIndex]
            if (!item) return context.dataset.label ?? ''

            let value: number, lower: number, upper: number

            if (context.datasetIndex === 0) {
              // Observed
              if (!item.observed) return context.dataset.label ?? ''
              value = item.observed.Diff_Mean
              lower = item.observed.Diff_LCL
              upper = item.observed.Diff_UCL
            } else if (context.datasetIndex === 1) {
              // Base Model
              value = item.model.Base_Diff
              lower = item.model.Base_Diff_LCL
              upper = item.model.Base_Diff_UCL
            } else {
              // Fully Adjusted
              value = item.model.Full_Diff
              lower = item.model.Full_Diff_LCL
              upper = item.model.Full_Diff_UCL
            }

            return `${context.dataset.label}: ${value.toFixed(2)} [${lower.toFixed(2)}, ${upper.toFixed(2)}]`
          },
        },
      },
    },
    scales: {
      y: {
        min: minY - padding,
        max: maxY + padding,
        title: {
          display: true,
          text: 'Effect Estimate (Change from Baseline)',
        },
        grid: {
          color: 'rgba(128, 128, 128, 0.2)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div className={styles.chartContainer}>
      <BaseChart
        type="bar"
        data={chartData}
        options={chartOptions}
        height={350}
        showVerticalLine={false}
        plugins={[errorBarPlugin]}
      />
    </div>
  )
}

// Icons for view toggle
function TableIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  )
}

function BothIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <path d="M14 6h7M14 10h7M14 14h7M14 18h7M3 14h8v7H3z" />
    </svg>
  )
}

interface FactorEffectsSectionProps {
  factorObserved: import('@/types').FactorObservedSummaryRow[]
  factorModel: import('@/types').FactorModelSummaryRow[]
}

function FactorEffectsSection({ factorObserved, factorModel }: FactorEffectsSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [showObserved, setShowObserved] = useState(true)
  const [showBaseModel, setShowBaseModel] = useState(false)
  const [showFullModel, setShowFullModel] = useState(true)

  return (
    <section className={styles.tableSection}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Table 2b: Do Blood Characteristics Matter?</h2>
          <p className={styles.sectionDescription}>
            Comparison of transfusion effects across different blood component characteristics.
            Each row shows whether a particular characteristic (e.g., donor sex, storage time)
            is associated with different outcomes.
          </p>
        </div>
      </div>

      <div className={styles.interpretationHint}>
        <strong>Key insight:</strong> We found no clinically significant differences in vital parameter
        changes based on donor characteristics or storage time — reassuring for current transfusion practices.
      </div>

      {/* View Toggle */}
      <div className={styles.viewToggle}>
        <button
          className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
          onClick={() => setViewMode('table')}
        >
          <TableIcon /> Table
        </button>
        <button
          className={`${styles.viewToggleBtn} ${viewMode === 'chart' ? styles.viewToggleBtnActive : ''}`}
          onClick={() => setViewMode('chart')}
        >
          <ChartIcon /> Chart
        </button>
        <button
          className={`${styles.viewToggleBtn} ${viewMode === 'both' ? styles.viewToggleBtnActive : ''}`}
          onClick={() => setViewMode('both')}
        >
          <BothIcon /> Both
        </button>

        {/* Data type toggle - only show when charts are visible */}
        {(viewMode === 'chart' || viewMode === 'both') && (
          <div className={styles.dataToggle}>
            <label className={styles.dataToggleLabel}>
              <input
                type="checkbox"
                checked={showObserved}
                onChange={(e) => setShowObserved(e.target.checked)}
              />
              Observed
            </label>
            <label className={styles.dataToggleLabel}>
              <input
                type="checkbox"
                checked={showBaseModel}
                onChange={(e) => setShowBaseModel(e.target.checked)}
              />
              Base Model
            </label>
            <label className={styles.dataToggleLabel}>
              <input
                type="checkbox"
                checked={showFullModel}
                onChange={(e) => setShowFullModel(e.target.checked)}
              />
              Fully Adjusted
            </label>
          </div>
        )}
      </div>

      {/* Chart Legend */}
      {(viewMode === 'chart' || viewMode === 'both') && (
        <div className={styles.chartLegend}>
          {showObserved && (
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotObserved}`} />
              <span>Observed</span>
            </div>
          )}
          {showBaseModel && (
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotBase}`} />
              <span>Base Model</span>
            </div>
          )}
          {showFullModel && (
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotModel}`} />
              <span>Fully Adjusted Model</span>
            </div>
          )}
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'table' && (
        <SummaryTableB observedData={factorObserved} modelData={factorModel} />
      )}

      {viewMode === 'chart' && (
        <AllFactorForestPlots
          observedData={factorObserved}
          modelData={factorModel}
          showObserved={showObserved}
          showBaseModel={showBaseModel}
          showFullModel={showFullModel}
        />
      )}

      {viewMode === 'both' && (
        <InterleavedTableAndCharts
          factorObserved={factorObserved}
          factorModel={factorModel}
          showObserved={showObserved}
          showBaseModel={showBaseModel}
          showFullModel={showFullModel}
        />
      )}
    </section>
  )
}

/**
 * Interleaved view showing table then chart for each factor
 */
interface InterleavedProps {
  factorObserved: import('@/types').FactorObservedSummaryRow[]
  factorModel: import('@/types').FactorModelSummaryRow[]
  showObserved: boolean
  showBaseModel: boolean
  showFullModel: boolean
}

function InterleavedTableAndCharts({ factorObserved, factorModel, showObserved, showBaseModel, showFullModel }: InterleavedProps) {
  const groupedData = useGroupedFactorData(factorObserved, factorModel)

  // Get vitals that have data
  const vitalsWithData = VITAL_PARAM_CODES.filter(vital =>
    groupedData.some(g => g.dataByVital.has(vital))
  )

  const factorNames: Record<string, string> = {
    DonorHb_Cat: 'Donor Hemoglobin',
    Storage_Cat: 'Storage Time',
    DonorSex: 'Donor Sex',
    DonorParity: 'Donor Parity',
    wdy_donation: 'Donation Weekday',
  }

  return (
    <div className={styles.combinedView}>
      {groupedData.map(factorGroup => (
        <div key={factorGroup.factorCode} className={styles.factorCombinedSection}>
          {/* Table for this factor */}
          <SingleFactorTable
            factorGroup={factorGroup}
            vitalsWithData={vitalsWithData}
          />
          {/* Chart for this factor */}
          <FactorForestPlot
            factorCode={factorGroup.factorCode}
            factorName={factorNames[factorGroup.factorCode] || factorGroup.factorName}
            observedData={factorObserved}
            modelData={factorModel}
            showObserved={showObserved}
            showBaseModel={showBaseModel}
            showFullModel={showFullModel}
          />
        </div>
      ))}
      <div className={styles.tableFootnotes}>
        <p>
          <sup>1</sup><strong>Model Estimates:</strong> Based on the Fully Adjusted Model described in Table 2a, which includes all covariates from the Base Model plus cumulative crystalloid fluid and vasopressor volumes (1h and 24h prior), and sedative administration indicators.
        </p>
      </div>
    </div>
  )
}
