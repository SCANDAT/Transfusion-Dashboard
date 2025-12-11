import { useRef, useEffect, useMemo, memo } from 'react'
import { Chart } from 'react-chartjs-2'
import type { BaseChartProps } from '@/types/charts'
import { useChartTheme } from '@/hooks/useChartTheme'
import './chartConfig' // Ensure Chart.js components are registered
import styles from './BaseChart.module.css'

/**
 * BaseChart - Reusable Chart.js wrapper component
 *
 * This component provides a themed wrapper around react-chartjs-2's Chart component.
 * It automatically applies theme-appropriate colors and styling based on the app's
 * current theme state.
 *
 * Performance optimizations:
 * - Memoized options to prevent unnecessary re-renders
 * - Reduced animation duration for faster visual feedback
 * - Uses React.memo to prevent re-renders when props haven't changed
 */
function BaseChartInner<T extends 'line' | 'bar' | 'scatter' | 'doughnut' | 'pie' = 'line'>({
  type,
  data,
  options = {},
  height = 400,
  showVerticalLine = false,
  onChartReady,
  plugins = [],
}: BaseChartProps<T>) {
  const theme = useChartTheme()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null)

  const isCartesian = !['doughnut', 'pie', 'polarArea'].includes(type)

  // Memoize themed options to prevent unnecessary re-renders
  // Extract primitive values for stable dependency tracking
  const themeTextColor = theme.textColor
  const themeFontFamily = theme.fontFamily
  const themeBackgroundColor = theme.backgroundColor
  const themeGridColor = theme.gridColor
  const themeAxisColor = theme.axisColor

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const themedOptions = useMemo((): any => {
    // Prepare theme-based defaults
    const legendLabels = options.plugins?.legend?.labels || {}
    const titleFont = options.plugins?.title?.font || {}
    const tooltipOptions = options.plugins?.tooltip || {}

    // Apply theme colors to chart options
    const result: Record<string, unknown> = {
      responsive: true,
      maintainAspectRatio: false,
      // Faster animations for snappier feel
      animation: {
        duration: 150,
      },
      ...options,
      showVerticalLine,
      verticalLinePosition: 0, // Transfusion time
      plugins: {
        ...options.plugins,
        legend: {
          ...options.plugins?.legend,
          labels: {
            ...legendLabels,
            color: themeTextColor,
            font: {
              family: themeFontFamily,
              size: 12,
              ...legendLabels.font,
            },
          },
        },
        title: {
          ...options.plugins?.title,
          color: themeTextColor,
          font: {
            family: themeFontFamily,
            ...titleFont,
          },
        },
        tooltip: {
          ...tooltipOptions,
          backgroundColor: themeBackgroundColor,
          titleColor: themeTextColor,
          bodyColor: themeTextColor,
          borderColor: themeGridColor,
          borderWidth: 1,
        },
      },
    }

    // Only add Cartesian scales for supported chart types
    if (isCartesian) {
      // Safe access to scales
      const scales = options.scales || {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const xScale = (scales as any).x || {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const yScale = (scales as any).y || {}

      result.scales = {
        ...scales,
        x: {
          ...xScale,
          ticks: {
            ...xScale.ticks,
            color: themeTextColor,
            font: {
              family: themeFontFamily,
              size: 11,
              ...xScale.ticks?.font,
            },
          },
          grid: {
            ...xScale.grid,
            color: themeGridColor,
          },
          border: {
            ...xScale.border,
            color: themeAxisColor,
          },
        },
        y: {
          ...yScale,
          ticks: {
            ...yScale.ticks,
            color: themeTextColor,
            font: {
              family: themeFontFamily,
              size: 11,
              ...yScale.ticks?.font,
            },
          },
          grid: {
            ...yScale.grid,
            color: themeGridColor,
          },
          border: {
            ...yScale.border,
            color: themeAxisColor,
          },
        },
      }
    }

    return result
  }, [
    options,
    showVerticalLine,
    isCartesian,
    themeTextColor,
    themeFontFamily,
    themeBackgroundColor,
    themeGridColor,
    themeAxisColor,
  ])

  // Call onChartReady when chart instance is available
  useEffect(() => {
    if (chartRef.current && onChartReady) {
      const chartInstance = chartRef.current
      onChartReady(chartInstance)
    }
  }, [onChartReady])

  return (
    <div className={styles.chartContainer} style={{ height }}>
      <Chart ref={chartRef} type={type} data={data} options={themedOptions} plugins={plugins} />
    </div>
  )
}

// Memoize the component to prevent re-renders when props haven't changed
export const BaseChart = memo(BaseChartInner) as typeof BaseChartInner

export default BaseChart
