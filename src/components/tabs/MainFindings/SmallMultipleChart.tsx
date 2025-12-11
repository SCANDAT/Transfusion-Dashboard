import { useEffect, useState, memo } from 'react'
import { loadVisualizationData } from '@/services/dataService'
import type { VitalParamCode, CompFactorCode } from '@/types'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import styles from './MainFindings.module.css'

interface SmallMultipleChartProps {
  vitalParam: VitalParamCode
  compFactor: CompFactorCode
  isHovered?: boolean
}

interface SparklineData {
  series: {
    label: string
    color: string
    points: (number | null)[]
  }[]
  sampledTimes: number[]
  minY: number
  maxY: number
  rangeY: number
}

/**
 * SmallMultipleChart - A mini chart showing effect trends
 * Used in the main findings grid to give a quick visual preview
 *
 * Performance optimizations:
 * - Wrapped with React.memo to prevent re-renders when props don't change
 * - Data processing uses Maps for O(1) lookups
 */
export const SmallMultipleChart = memo(function SmallMultipleChart({
  vitalParam,
  compFactor,
  isHovered = false,
}: SmallMultipleChartProps) {
  const [sparklineData, setSparklineData] = useState<SparklineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    loadVisualizationData(vitalParam, compFactor)
      .then(data => {
        if (cancelled) return

        if (!data || data.rows.length === 0) {
          setSparklineData(null)
          setLoading(false)
          return
        }

        // Process data immediately to avoid storing full dataset in state
        // Group by comparison value and get aggregated trend
        const compValues = data.comparisonValues
        const timePoints = [...new Set(data.rows.map(r => r.TimeFromTransfusion))].sort((a, b) => a - b)

        // Sample time points for mini chart (reduce to ~10-15 points)
        const sampleInterval = Math.max(1, Math.floor(timePoints.length / 12))
        const sampledTimes = timePoints.filter((_, i) => i % sampleInterval === 0)

        if (sampledTimes.length < 2) {
          setSparklineData(null)
          setLoading(false)
          return
        }

        // Pre-build a Map for O(1) lookups instead of O(n) filter/find operations
        const rowMap = new Map<string, number | undefined>()
        for (const row of data.rows) {
          rowMap.set(`${row.CompValue}_${row.TimeFromTransfusion}`, row.Delta_Full)
        }

        // Build series for each comparison value using Map lookups
        const series = compValues.map((compVal, colorIdx) => {
          const points = sampledTimes.map(time => rowMap.get(`${compVal}_${time}`) ?? null)
          return {
            label: String(compVal),
            color: CHART_COLORS[colorIdx % CHART_COLORS.length] || '#000000',
            points,
          }
        })

        // Calculate y-axis range across all series
        const allValues = series.flatMap(s => s.points.filter((p): p is number => p !== null))

        if (allValues.length === 0) {
          setSparklineData(null)
        } else {
          const minY = Math.min(...allValues)
          const maxY = Math.max(...allValues)
          const rangeY = maxY - minY || 1

          setSparklineData({
            series,
            sampledTimes,
            minY,
            maxY,
            rangeY,
          })
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [vitalParam, compFactor])

  if (loading) {
    return (
      <div className={styles.miniChartLoading}>
        <div className={styles.miniChartSpinner} />
      </div>
    )
  }

  if (error || !sparklineData) {
    return (
      <div className={styles.miniChartError}>
        <span>—</span>
      </div>
    )
  }

  const { series, sampledTimes, minY, rangeY } = sparklineData
  const width = 70
  const height = 40
  const padding = 2

  // Calculate x position for transfusion time (time = 0)
  const minTime = sampledTimes[0] ?? -720
  const maxTime = sampledTimes[sampledTimes.length - 1] ?? 720
  const timeRange = maxTime - minTime
  const transfusionX = timeRange > 0
    ? padding + ((0 - minTime) / timeRange) * (width - padding * 2)
    : width / 2

  return (
    <svg
      className={`${styles.miniChartSvg} ${isHovered ? styles.miniChartHovered : ''}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {/* Transfusion time vertical line */}
      <line
        x1={transfusionX}
        y1={padding}
        x2={transfusionX}
        y2={height - padding}
        stroke="var(--color-text-muted)"
        strokeWidth="0.5"
        strokeDasharray="1,2"
        opacity={0.5}
      />

      {/* Zero line (horizontal) */}
      {minY < 0 && (
        <line
          x1={padding}
          y1={height - padding - ((0 - minY) / rangeY) * (height - padding * 2)}
          x2={width - padding}
          y2={height - padding - ((0 - minY) / rangeY) * (height - padding * 2)}
          stroke="var(--color-border-subtle)"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
      )}

      {/* Draw each series as a polyline */}
      {series.map((s, seriesIdx) => {
        const validPoints = s.points
          .map((y, i) => (y !== null ? { x: i, y } : null))
          .filter((p): p is { x: number; y: number } => p !== null)

        if (validPoints.length < 2) return null

        const pathPoints = validPoints.map(p => {
          const x = padding + (p.x / (sampledTimes.length - 1)) * (width - padding * 2)
          const y = height - padding - ((p.y - minY) / rangeY) * (height - padding * 2)
          return `${x},${y}`
        })

        return (
          <polyline
            key={seriesIdx}
            points={pathPoints.join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth={isHovered ? 1.5 : 1}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isHovered ? 1 : 0.7}
          />
        )
      })}
    </svg>
  )
})
