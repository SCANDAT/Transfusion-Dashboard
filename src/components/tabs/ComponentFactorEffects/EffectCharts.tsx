import { useRef, useCallback, useMemo, memo } from 'react'
import type { Chart as ChartInstance, ChartOptions } from 'chart.js'
import { BaseChart, exportChartAsSVG, prepareVisualizationChartData } from '@/components/charts'
import { COMP_FACTORS } from '@/types'
import type { VisualizationData, TimeRange, ChartDisplayOptions } from '@/types'
import { useChartTheme } from '@/hooks/useChartTheme'
import styles from './ComponentFactorEffects.module.css'

// Category labels for human-readable display
const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  DonorHb_Cat: {
    '1': '<125 g/L',
    '2': '125-139 g/L',
    '3': '140-154 g/L',
    '4': '155-169 g/L',
    '5': '≥170 g/L',
  },
  Storage_Cat: {
    '1': '<10 days',
    '2': '10-19 days',
    '3': '20-29 days',
    '4': '30-39 days',
    '5': '≥40 days',
  },
  DonorSex: {
    '1': 'Male',
    '2': 'Female',
  },
  DonorParity: {
    '0': 'Nulliparous',
    '1': 'Parous',
  },
  wdy_donation: {
    '1': 'Sunday',
    '2': 'Monday',
    '3': 'Tuesday',
    '4': 'Wednesday',
    '5': 'Thursday',
    '6': 'Friday',
    '7': 'Saturday',
  },
}

/**
 * Get human-readable label for a category value
 */
function getCategoryLabel(factor: string, value: string | number): string {
  const factorLabels = CATEGORY_LABELS[factor]
  if (factorLabels) {
    const label = factorLabels[String(value)]
    if (label) return label
  }
  return String(value)
}

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
        labels: {
          color: theme.textColor,
          filter: (item) => {
            // Hide CI band labels and base model labels from legend
            return !item.text?.includes('CI') && !item.text?.includes('Base')
          },
          usePointStyle: true,
          boxWidth: 8,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets
            const seen = new Set<string>()
            return datasets
              .filter((ds) => {
                const label = ds.label || ''
                // Only show main lines (not CI or Base)
                if (label.includes('CI') || label.includes('Base')) return false
                if (seen.has(label)) return false
                seen.add(label)
                return true
              })
              .map((ds, i) => ({
                text: getCategoryLabel(comparisonColumn, ds.label || ''),
                fillStyle: ds.borderColor as string,
                strokeStyle: ds.borderColor as string,
                fontColor: theme.textColor,
                lineWidth: 2,
                hidden: false,
                index: i,
              }))
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
            const displayLabel = getCategoryLabel(comparisonColumn, label.replace(' (Base)', ''))
            const isBase = label.includes('Base')
            const value = context.parsed.y?.toFixed(2) ?? 'N/A'
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
      const filename = `${metadata.vitalParam}_${comparisonColumn}_${suffix}.svg`
      exportChartAsSVG(chartRef.current, filename)
    }
  }, [metadata.vitalParam, comparisonColumn, showDelta])

  return (
    <div className={styles.chartsContainer}>
      <div className={styles.chartCard}>
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
          Export
        </button>
      </div>
    </div>
  )
})
