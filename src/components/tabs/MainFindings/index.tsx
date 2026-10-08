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
import { SummaryTableA } from './SummaryTableA'
import { ModelSummaryChart } from './ModelSummaryChart'
import { FactorSummaryNotes } from './FactorSummaryNotes'
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

async function loadMainFindings() {
  const [vizIndex, vitalSummary, modelVitalSummary, factorObserved, factorModel] = await Promise.all([
    loadVizIndex(),
    loadVitalSummary(),
    loadModelVitalSummary(),
    loadFactorObservedSummary(),
    loadFactorModelSummary(),
  ])
  return { vizIndex, vitalSummary, modelVitalSummary, factorObserved, factorModel }
}

export function MainFindingsTab() {
  const setLoading = useDashboardStore(state => state.setLoading)
  const setError = useDashboardStore(state => state.setError)

  // A failed required summary must not silently disappear from the findings page.
  const { data, loading: isLoading, error, refetch } = useAsyncData(loadMainFindings, [])
  const { vizIndex, vitalSummary, modelVitalSummary, factorObserved, factorModel } = data ?? {}

  useEffect(() => {
    setLoading(isLoading)
  }, [isLoading, setLoading])

  useEffect(() => {
    if (error) {
      setError(error.message)
    }
  }, [error, setError])

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
      <div className={styles.loading} role="status">
        Loading main findings...
      </div>
    )
  }

  if (error || !data || !vizIndex) {
    return (
      <div className={styles.error} role="alert">
        <p>The results could not be loaded completely. Please try again.</p>
        <button type="button" onClick={refetch}>Retry loading results</button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h2 className={styles.title}>Key Results</h2>
        <p className={styles.description}>
          This section presents seven vital-parameter trajectories during the 12 hours before and
          after RBC transfusion start, together with pre/post summaries and comparisons by donor
          and component characteristics.
        </p>
      </section>

      <section className={styles.guideSection}>
        <div className={styles.guideHeader}>
          <HelpIcon />
          <h3>How to Interpret These Results</h3>
        </div>
        <div className={styles.guideContent}>
          <div className={styles.guideItem}>
            <strong>Positive change</strong> means the value at +1 hour is higher than at −1 hour
          </div>
          <div className={styles.guideItem}>
            <strong>Negative change</strong> means the value at +1 hour is lower than at −1 hour
          </div>
          <div className={styles.guideItem}>
            <strong>Uncertainty</strong>: the model-based change intervals are under review and
            should not be used to draw conclusions about statistical significance
          </div>
          <div className={styles.guideItem}>
            <strong>Adjusted models</strong> include recorded patient characteristics and treatments;
            adjustment does not establish a causal transfusion effect
          </div>
        </div>
      </section>

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

      {vitalSummary && modelVitalSummary && (
        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Table 2a: Changes Around Transfusion Start</h2>
              <p className={styles.sectionDescription}>
                Observed summaries and model estimates compare values centred on one hour before
                and one hour after transfusion start.
              </p>
            </div>
          </div>
          <div className={styles.interpretationHint}>
            <strong>Time comparison:</strong> Changes are reported as the post-transfusion value
            minus the pre-transfusion value. The trajectories also show trends before transfusion start.
          </div>
          <SummaryTableA observedData={vitalSummary} modelData={modelVitalSummary} />
        </section>
      )}

      {modelVitalSummary && vitalSummary && (
        <section className={styles.chartSection}>
          <h2 className={styles.sectionTitle}>Pre/Post Changes</h2>
          <p className={styles.sectionDescription}>
            Changes from −1 to +1 hour are shown separately for each vital parameter.
            Each panel has its own scale and measurement unit.
          </p>
          <ModelSummaryChart modelData={modelVitalSummary} observedData={vitalSummary} />
        </section>
      )}

      <section className={styles.gridSection}>
        <h2 className={styles.sectionTitle}>Trajectory Overview Grid</h2>
        <p className={styles.sectionDescription}>
          Each cell shows changes in fully adjusted model predictions relative to one hour before
          transfusion, grouped by component category. These are fitted-model trajectories.
          Click any cell to explore the full interactive visualization.
        </p>
        <div className={styles.gridLegend}>
          <span>Rows: Vital parameters</span>
          <span>Columns: Component factors</span>
          <span>Colors: Factor categories</span>
        </div>
        <VirtualizedGrid vizIndex={vizIndex} />
      </section>

      {factorObserved && factorModel && (
        <FactorEffectsSection
          factorObserved={factorObserved}
          factorModel={factorModel}
        />
      )}
    </div>
  )
}

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
          <h2 className={styles.sectionTitle}>Table 2b: Changes by Donor and Component Category</h2>
          <p className={styles.sectionDescription}>
            Each row summarises the pre/post change within a donor or component category.
            These within-category summaries are not estimates of differences between categories.
          </p>
        </div>
      </div>

      <div className={styles.interpretationHint}>
        <strong>Interpretation:</strong> Between-category contrasts and their uncertainty require
        reconciliation before conclusions about effect modification can be drawn.
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
              No-interaction model (base)
            </label>
            <label className={styles.dataToggleLabel}>
              <input
                type="checkbox"
                checked={showFullModel}
                onChange={(e) => setShowFullModel(e.target.checked)}
              />
              No-interaction model (fully adjusted)
            </label>
          </div>
        )}
      </div>

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
              <span>No-interaction model (base)</span>
            </div>
          )}
          {showFullModel && (
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotModel}`} />
              <span>No-interaction model (fully adjusted)</span>
            </div>
          )}
        </div>
      )}

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

interface InterleavedProps {
  factorObserved: import('@/types').FactorObservedSummaryRow[]
  factorModel: import('@/types').FactorModelSummaryRow[]
  showObserved: boolean
  showBaseModel: boolean
  showFullModel: boolean
}

function InterleavedTableAndCharts({ factorObserved, factorModel, showObserved, showBaseModel, showFullModel }: InterleavedProps) {
  const groupedData = useGroupedFactorData(factorObserved, factorModel)

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
          <SingleFactorTable
            factorGroup={factorGroup}
            vitalsWithData={vitalsWithData}
          />
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
      <FactorSummaryNotes />
    </div>
  )
}
