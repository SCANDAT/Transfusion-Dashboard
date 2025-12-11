import { useRef, useCallback, useMemo, memo } from 'react'
import type { Chart as ChartInstance, ChartOptions } from 'chart.js'
import { BaseChart, exportChartAsSVG } from '@/components/charts'
import { VITAL_PARAMS } from '@/types'
import type { VitalParamCode, TransfusionDataRow, LoessDataRow } from '@/types'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import { sortBy } from 'lodash-es'
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
  modelMode: 'absolute' | 'relative'
  chartDisplay: 'both' | 'loess' | 'model'
  useFlexibleHeight: boolean
}

// Memoize component to prevent re-renders when parent state changes but props are same
export const PlotPair = memo(function PlotPair({
  vitalParam,
  transfusionData,
  loessData,
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

  // Memoize filtered data - only recalculate when data or timeRange changes
  const filteredData = useMemo(() =>
    transfusionData.filter(
      row => row.TimeFromTransfusion >= timeRange[0] && row.TimeFromTransfusion <= timeRange[1]
    ),
    [transfusionData, timeRange]
  )

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

  // Memoize model chart data based on modelMode
  const modelChartData = useMemo(() => {
    if (modelMode === 'absolute') {
      return prepareAbsolutePlotData(filteredData, displayOptions)
    } else {
      return prepareRelativePlotData(filteredData, displayOptions)
    }
  }, [filteredData, displayOptions, modelMode])

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
          text: vitalInfo.yAxisLabel,
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
      exportChartAsSVG(loessChartRef.current, `${vitalParam}_loess.svg`)
    }
  }, [vitalParam])

  const handleExportModel = useCallback(() => {
    if (modelChartRef.current) {
      exportChartAsSVG(modelChartRef.current, `${vitalParam}_${modelMode}.svg`)
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
          <div className={styles.plotLabel}>Observed Data (LOESS Smoothed)</div>
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
            Export
          </button>
        </div>
      )}

      {/* Model Plot */}
      {chartDisplay !== 'loess' && (
        <div className={styles.plotContainer}>
          <div className={styles.plotLabel}>
            Model Prediction ({modelMode === 'absolute' ? 'Absolute' : 'Change from Baseline'})
          </div>
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
            Export
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
      label: 'LOESS Smooth',
      data: sortedLoess.map((r: LoessDataRow) => ({ x: r.TimeFromTransfusion, y: r.Pred })),
      borderColor: loessColor,
      backgroundColor: loessColor,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
    })
  }

  return { datasets }
}

/**
 * Prepare absolute (predicted values) plot data
 */
function prepareAbsolutePlotData(
  data: TransfusionDataRow[],
  options: { showConfidenceInterval: boolean; showBaseModel: boolean }
) {
  const sorted = sortBy(data, 'TimeFromTransfusion')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datasets: any[] = []
  const mainColor = CHART_COLORS[0]

  // CI bands - upper line first (no fill), then lower line fills up to upper
  if (options.showConfidenceInterval) {
    datasets.push({
      label: 'CI Upper',
      data: sorted.map((r: TransfusionDataRow) => ({ x: r.TimeFromTransfusion, y: r.Upper_Full })),
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      fill: false,
      pointRadius: 0,
      tension: 0.3,
    })
    datasets.push({
      label: 'CI Lower',
      data: sorted.map((r: TransfusionDataRow) => ({ x: r.TimeFromTransfusion, y: r.Lower_Full })),
      borderColor: 'transparent',
      backgroundColor: `${mainColor}20`,
      fill: '-1', // Fill up to previous dataset (upper CI)
      pointRadius: 0,
      tension: 0.3,
    })
  }

  // Main line (Fully Adjusted Model)
  datasets.push({
    label: 'Full Model',
    data: sorted.map((r: TransfusionDataRow) => ({ x: r.TimeFromTransfusion, y: r.PredVal_Full })),
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
      data: sorted.map((r: TransfusionDataRow) => ({ x: r.TimeFromTransfusion, y: r.PredVal_Base ?? r.PredVal_Full })),
      borderColor: mainColor,
      borderWidth: 1,
      borderDash: [5, 5],
      pointRadius: 0,
      tension: 0.3,
    })
  }

  return { datasets }
}

/**
 * Prepare relative (change from baseline) plot data
 */
function prepareRelativePlotData(
  data: TransfusionDataRow[],
  options: { showConfidenceInterval: boolean; showBaseModel: boolean }
) {
  const sorted = sortBy(data, 'TimeFromTransfusion')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datasets: any[] = []
  const mainColor = CHART_COLORS[0]

  // CI bands - upper line first (no fill), then lower line fills up to upper
  if (options.showConfidenceInterval) {
    datasets.push({
      label: 'CI Upper',
      data: sorted.map((r: TransfusionDataRow) => ({ x: r.TimeFromTransfusion, y: r.Delta_Upper ?? r.Delta_Full })),
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      fill: false,
      pointRadius: 0,
      tension: 0.3,
    })
    datasets.push({
      label: 'CI Lower',
      data: sorted.map((r: TransfusionDataRow) => ({ x: r.TimeFromTransfusion, y: r.Delta_Lower ?? r.Delta_Full })),
      borderColor: 'transparent',
      backgroundColor: `${mainColor}20`,
      fill: '-1', // Fill up to previous dataset (upper CI)
      pointRadius: 0,
      tension: 0.3,
    })
  }

  datasets.push({
    label: 'Full Model',
    data: sorted.map((r: TransfusionDataRow) => ({ x: r.TimeFromTransfusion, y: r.Delta_Full })),
    borderColor: mainColor,
    backgroundColor: mainColor,
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.3,
  })

  if (options.showBaseModel) {
    datasets.push({
      label: 'Base Model',
      data: sorted.map((r: TransfusionDataRow) => ({ x: r.TimeFromTransfusion, y: r.Delta_Base ?? r.Delta_Full })),
      borderColor: mainColor,
      borderWidth: 1,
      borderDash: [5, 5],
      pointRadius: 0,
      tension: 0.3,
    })
  }

  return { datasets }
}
