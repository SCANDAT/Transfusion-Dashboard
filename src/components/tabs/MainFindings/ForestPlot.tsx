import { useMemo } from 'react'
import type { ForestPlotPoint } from '@/types'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import styles from './MainFindings.module.css'

interface ForestPlotProps {
  data: ForestPlotPoint[]
  title: string
  xAxisLabel?: string
  showZeroLine?: boolean
  colorByIndex?: boolean
}

/**
 * ForestPlot - Horizontal bar chart with confidence intervals
 * Used to display effect estimates with their uncertainty
 */
export function ForestPlot({
  data,
  title,
  xAxisLabel = 'Effect Estimate',
  showZeroLine = true,
  colorByIndex = true,
}: ForestPlotProps) {
  const { minX, maxX, range, zeroPosition } = useMemo(() => {
    const allValues = data.flatMap(d => [d.lower, d.upper, d.estimate])
    let min = Math.min(...allValues)
    let max = Math.max(...allValues)

    if (showZeroLine) {
      min = Math.min(min, 0)
      max = Math.max(max, 0)
    }

    const padding = (max - min) * 0.1
    min -= padding
    max += padding

    const r = max - min
    const zeroPos = showZeroLine ? ((0 - min) / r) * 100 : null

    return { minX: min, maxX: max, range: r, zeroPosition: zeroPos }
  }, [data, showZeroLine])

  if (data.length === 0) {
    return (
      <div className={styles.forestPlotEmpty}>
        No data available
      </div>
    )
  }

  return (
    <div className={styles.forestPlot}>
      <h3 className={styles.forestPlotTitle}>{title}</h3>

      <div className={styles.forestPlotContainer}>
        <div className={styles.forestPlotLabels}>
          {data.map((point, idx) => (
            <div key={idx} className={styles.forestPlotLabelRow}>
              <span className={styles.forestPlotLabel}>{point.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.forestPlotChart}>
          {showZeroLine && zeroPosition !== null && (
            <div
              className={styles.forestPlotZeroLine}
              style={{ left: `${zeroPosition}%` }}
            />
          )}

          {data.map((point, idx) => {
            const estimatePos = ((point.estimate - minX) / range) * 100
            const lowerPos = ((point.lower - minX) / range) * 100
            const upperPos = ((point.upper - minX) / range) * 100
            const barWidth = upperPos - lowerPos
            const color = colorByIndex
              ? CHART_COLORS[idx % CHART_COLORS.length]
              : CHART_COLORS[0]

            return (
              <div key={idx} className={styles.forestPlotRow}>
                <div
                  className={styles.forestPlotCIBar}
                  style={{
                    left: `${lowerPos}%`,
                    width: `${barWidth}%`,
                    backgroundColor: `${color}40`,
                    borderColor: color as string,
                  }}
                />
                <div
                  className={styles.forestPlotDiamond}
                  style={{
                    left: `${estimatePos}%`,
                    backgroundColor: color as string,
                  }}
                  title={`${point.label}: ${point.estimate.toFixed(2)} [${point.lower.toFixed(2)}, ${point.upper.toFixed(2)}]`}
                />
              </div>
            )
          })}

          <div className={styles.forestPlotXAxis}>
            <span className={styles.forestPlotAxisMin}>{minX.toFixed(1)}</span>
            {showZeroLine && <span className={styles.forestPlotAxisZero}>0</span>}
            <span className={styles.forestPlotAxisMax}>{maxX.toFixed(1)}</span>
          </div>
        </div>

        <div className={styles.forestPlotValues}>
          {data.map((point, idx) => (
            <div key={idx} className={styles.forestPlotValueRow}>
              <span className={styles.forestPlotValue}>
                {point.estimate.toFixed(2)}
              </span>
              <span className={styles.forestPlotCI}>
                [{point.lower.toFixed(2)}, {point.upper.toFixed(2)}]
              </span>
            </div>
          ))}
        </div>
      </div>

      {xAxisLabel && (
        <div className={styles.forestPlotXAxisLabel}>{xAxisLabel}</div>
      )}
    </div>
  )
}
