import { useRef, useCallback, useMemo, memo } from 'react'
import type { Chart as ChartInstance, ChartOptions } from 'chart.js'
import { BaseChart, exportChartAsPNG, prepareTransfusionChartData } from '@/components/charts'
import { VITAL_PARAMS } from '@/types'
import type { VitalParamCode, TransfusionDataRow, LoessDataRow } from '@/types'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import { sortBy } from 'lodash-es'
import styles from './RBCTransfusions.module.css'

interface PlotPairProps {
  vitalParam: VitalParamCode
  transfusionData: TransfusionDataRow[]
  loessData: LoessDataRow[]
  loessLoading?: boolean
  loessError?: Error | null
  onRetryLoess?: () => void
  timeRange: [number, number]
  displayOptions: {
    showConfidenceInterval: boolean
    showBaseModel: boolean
    showDeltaPlot: boolean
  }
  modelMode: 'absolute' | 'relative'
  chartDisplay: 'both' | 'loess' | 'model'
  useFlexibleHeight: boolean
}

// Memoize component to prevent re-renders when parent state changes but props are same
export const PlotPair = memo(function PlotPair({
  vitalParam,
  transfusionData,
  loessData,
  loessLoading = false,
  loessError = null,
  onRetryLoess,
  timeRange,
  displayOptions,
  modelMode,
  chartDisplay,
  useFlexibleHeight,
}: PlotPairProps) {
  const loessChartRef = useRef<ChartInstance | null>(null)
  const modelChartRef = useRef<ChartInstance | null>(null)

  const vitalInfo = VITAL_PARAMS[vitalParam]
  const isSingleChart = chartDisplay !== 'both'

  // For 1-2 charts use fixed height, for 3+ use flexible height
  const chartHeight = useFlexibleHeight ? "100%" : 280

  const filteredLoess = useMemo(() =>
    loessData.filter(
      row => row.TimeFromTransfusion >= timeRange[0] && row.TimeFromTransfusion <= timeRange[1]
    ),
    [loessData, timeRange]
  )

  // Memoize LOESS chart data
  const loessChartData = useMemo(() =>
    prepareLoessPlotData(filteredLoess),
    [filteredLoess]
  )

  const modelChartData = useMemo(() =>
    prepareTransfusionChartData(transfusionData, timeRange, {
      ...displayOptions,
      showDeltaPlot: modelMode === 'relative',
    }),
    [transfusionData, timeRange, displayOptions, modelMode]
  )

  // Chart options for LOESS plot
  const loessOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            return typeof value === 'number' && Number.isFinite(value)
              ? `LOESS: ${value.toFixed(2)} z-score` : 'LOESS: unavailable'
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Time from Transfusion (minutes)',
          font: { size: 11 },
        },
        min: timeRange[0],
        max: timeRange[1],
      },
      y: {
        title: {
          display: true,
          text: 'Standardized value (z-score)',
          font: { size: 11 },
        },
      },
    },
  }

  // Chart options for model plot (absolute or relative)
  const modelOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: 10 },
          filter: (item) => !item.text?.includes('CI'),
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Time from Transfusion (minutes)',
          font: { size: 11 },
        },
        min: timeRange[0],
        max: timeRange[1],
      },
      y: {
        title: {
          display: true,
          text: modelMode === 'absolute' ? vitalInfo.yAxisLabel : vitalInfo.deltaYAxisLabel,
          font: { size: 11 },
        },
      },
    },
  }

  const handleExportLoess = useCallback(() => {
    if (loessChartRef.current) {
      exportChartAsPNG(loessChartRef.current, `${vitalParam}_loess.png`)
    }
  }, [vitalParam])

  const handleExportModel = useCallback(() => {
    if (modelChartRef.current) {
      exportChartAsPNG(modelChartRef.current, `${vitalParam}_${modelMode}.png`)
    }
  }, [vitalParam, modelMode])

  const plotPairClasses = [
    styles.plotPair,
    isSingleChart ? styles.singleChart : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={plotPairClasses}>
      {/* Header with vital badge */}
      <div className={styles.plotHeader}>
        <div className={styles.vitalBadge}>
          <div className={styles.vitalIcon}>
            {vitalInfo.shortName}
          </div>
          <span className={styles.vitalName}>{vitalInfo.name}</span>
        </div>
      </div>

      {/* LOESS Plot */}
      {chartDisplay !== 'model' && (
        <div className={styles.plotContainer}>
          <div className={styles.plotLabel}>Standardized Observations (LOESS)</div>
          {loessLoading ? (
            <p role="status" className={styles.plotLabel}>Loading LOESS data...</p>
          ) : loessError ? (
            <div role="alert" className={styles.plotLabel}>
              Unable to load LOESS data.
              {onRetryLoess && <button onClick={onRetryLoess}>Retry LOESS data</button>}
            </div>
          ) : filteredLoess.length === 0 ? (
            <p role="note" className={styles.plotLabel}>No LOESS data are available for this selection.</p>
          ) : (
            <>
              <div className={styles.chartWrapper}>
                <BaseChart
                  type="line"
                  data={loessChartData}
                  options={loessOptions}
                  height={chartHeight}
                  showVerticalLine
                  onChartReady={(chart) => { loessChartRef.current = chart }}
                />
              </div>
              <button className={styles.exportBtn} onClick={handleExportLoess}>
                Export PNG
              </button>
            </>
          )}
        </div>
      )}

      {/* Model Plot */}
      {chartDisplay !== 'loess' && (
        <div className={styles.plotContainer}>
          <div className={styles.plotLabel}>
            Model Prediction ({modelMode === 'absolute' ? 'Absolute' : 'Change from Baseline'})
          </div>
          {modelMode === 'relative' && (
            <p role="note" className={styles.plotLabel}>
              Confidence intervals for change are unavailable; only point estimates are shown.
            </p>
          )}
          <div className={styles.chartWrapper}>
            <BaseChart
              type="line"
              data={modelChartData}
              options={modelOptions}
              height={chartHeight}
              showVerticalLine
              onChartReady={(chart) => { modelChartRef.current = chart }}
            />
          </div>
          <button className={styles.exportBtn} onClick={handleExportModel}>
            Export PNG
          </button>
        </div>
      )}
    </div>
  )
})

/**
 * Prepare LOESS-only plot data
 */
function prepareLoessPlotData(loess: LoessDataRow[]) {
  const sortedLoess = sortBy(loess, 'TimeFromTransfusion')
  const loessColor = CHART_COLORS[2]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datasets: any[] = []

  if (sortedLoess.length > 0) {
    datasets.push({
      label: 'LOESS (z-score)',
      data: sortedLoess.map((r: LoessDataRow) => ({ x: r.TimeFromTransfusion, y: r.Pred })),
      borderColor: loessColor,
      backgroundColor: loessColor,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0,
      spanGaps: false,
    })
  }

  return { datasets }
}
