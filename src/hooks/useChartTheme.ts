import { useMemo } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'

export interface ChartTheme {
  gridColor: string
  textColor: string
  axisColor: string
  backgroundColor: string
  fontFamily: string
  tickColor: string
  legendColor: string
  tooltipBackground: string
  tooltipText: string
}

export function useChartTheme(): ChartTheme {
  const theme = useDashboardStore(state => state.theme)
  const isLight = theme === 'light'

  return useMemo(() => {
    const textColor = isLight ? '#475569' : '#94a3b8'
    const backgroundColor = isLight ? '#ffffff' : '#16161f'
    return {
      gridColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
      textColor,
      axisColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
      backgroundColor,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      tickColor: textColor,
      legendColor: textColor,
      tooltipBackground: backgroundColor,
      tooltipText: textColor,
    }
  }, [isLight])
}

export const CHART_COLORS = [
  '#635BFF',
  '#E82127',
  '#10B981',
  '#F59E0B',
  '#0A84FF',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
] as const

export const SCANDAT_RED = '#E82127'

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] as string
}
