import { getFactorCategoryLabel } from '@/utils/factorLabels'
import { useRef, useCallback, useMemo, memo } from 'react'
import type { Chart as ChartInstance, ChartOptions } from 'chart.js'
import { BaseChart, exportChartAsPNG, prepareVisualizationChartData } from '@/components/charts'
import { COMP_FACTORS } from '@/types'
import type { VisualizationData, TimeRange, ChartDisplayOptions } from '@/types'
import { useChartTheme } from '@/hooks/useChartTheme'
import styles from './ComponentFactorEffects.module.css'

interface EffectChartsProps {
  data: VisualizationData
  selectedComparisons: (string | number)[]
  timeRange: TimeRange
  displayOptions: ChartDisplayOptions
}

// Memoize component to prevent re-renders when parent state changes but props are same
export const EffectCharts = memo(function EffectCharts({
  data,
  selectedComparisons,
  timeRange,
  displayOptions,
}: EffectChartsProps) {
  const chartRef = useRef<ChartInstance | null>(null)
  const theme = useChartTheme()

  const { metadata, comparisonColumn } = data
  const factorInfo = COMP_FACTORS[comparisonColumn]

  // Determine if we're showing delta (change from baseline) or absolute values
  const showDelta = displayOptions.showDeltaPlot

  // Prepare chart data - single chart that switches between absolute and delta
  const chartData = useMemo(() =>
    prepareVisualizationChartData(
      data.rows,
      comparisonColumn,
      selectedComparisons,
      timeRange,
      displayOptions
    ),
    [data.rows, comparisonColumn, selectedComparisons, timeRange, displayOptions]
  )

  // Chart options with proper labels
  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
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
        onClick: (_event, item, legend) => {
          const chart = legend.chart
          const index = item.datasetIndex
          if (index === undefined) return
          const category = chart.data.datasets[index]?.label
          if (category === undefined) return
          const visible = chart.isDatasetVisible(index)
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            if (dataset.label === category || dataset.label?.startsWith(`${category} (`)) {
              chart.setDatasetVisibility(datasetIndex, !visible)
            }
          })
          chart.update()
        },
        labels: {
          color: theme.textColor,
          filter: (item) => {
            // Hide CI band labels and base model labels from legend
            return !item.text?.includes('CI') && !item.text?.includes('Base')
          },
          usePointStyle: true,
          boxWidth: 8,
          generateLabels: (chart) => {
            return chart.data.datasets.flatMap((dataset, datasetIndex) => {
              const label = dataset.label || ''
              if (label.includes('CI') || label.includes('Base')) return []
              return [{
                text: getFactorCategoryLabel(comparisonColumn, label),
                fillStyle: dataset.borderColor as string,
                strokeStyle: dataset.borderColor as string,
                fontColor: theme.textColor,
                lineWidth: 2,
                hidden: !chart.isDatasetVisible(datasetIndex),
                datasetIndex,
              }]
            })
          },
        },
      },
      title: {
        display: true,
        text: showDelta
          ? `Change in ${metadata.vitalName} by ${factorInfo.name}`
          : `${metadata.vitalName} Trajectory by ${factorInfo.name}`,
        font: { size: 16, weight: 'bold' as const },
        color: theme.textColor,
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            if (items.length > 0 && items[0]) {
              const time = items[0].parsed.x
              return `Time: ${time} min from transfusion`
            }
            return ''
          },
          label: (context) => {
            const label = context.dataset.label || ''
            // Skip CI datasets in tooltip
            if (label.includes('CI')) return ''
            const displayLabel = getFactorCategoryLabel(comparisonColumn, label.replace(' (Base)', ''))
            const isBase = label.includes('Base')
            const value = typeof context.parsed.y === 'number' && Number.isFinite(context.parsed.y)
              ? context.parsed.y.toFixed(2) : 'N/A'
            const unit = showDelta ? '' : ` ${metadata.yLabel.match(/\(([^)]+)\)/)?.[1] || ''}`
            return `${displayLabel}${isBase ? ' (Base)' : ''}: ${value}${unit}`
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        title: {
          display: true,
          text: 'Time from Transfusion (minutes)',
        },
        min: timeRange[0],
        max: timeRange[1],
        ticks: {
          callback: (value) => {
            const numValue = Number(value)
            if (numValue === 0) return '0 (Transfusion)'
            return `${numValue}`
          },
        },
      },
      y: {
        title: {
          display: true,
          text: showDelta ? metadata.deltaYLabel : metadata.yLabel,
        },
      },
    },
  }), [metadata, factorInfo, showDelta, timeRange, comparisonColumn, theme.textColor])

  const handleExport = useCallback(() => {
    if (chartRef.current) {
      const suffix = showDelta ? 'delta' : 'trajectory'
      const filename = `${metadata.vitalParam}_${comparisonColumn}_${suffix}.png`
      exportChartAsPNG(chartRef.current, filename)
    }
  }, [metadata.vitalParam, comparisonColumn, showDelta])

  return (
    <div className={styles.chartsContainer}>
      <div className={styles.chartCard}>
        {showDelta && (
          <p role="note" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Confidence intervals for change are unavailable; only point estimates are shown.
          </p>
        )}
        <div className={styles.chartWrapper}>
          <BaseChart
            type="line"
            data={chartData}
            options={chartOptions}
            height="100%"
            showVerticalLine
            onChartReady={(chart) => { chartRef.current = chart }}
          />
        </div>
        <button className={styles.exportBtn} onClick={handleExport}>
          Export PNG
        </button>
      </div>
    </div>
  )
})
