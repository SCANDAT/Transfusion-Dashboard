import type { ChartData, ChartOptions, ChartType, Plugin } from 'chart.js'

export interface BaseChartProps<T extends ChartType = 'line'> {
  type: T
  data: ChartData<T>
  options?: ChartOptions<T>
  height?: number | string
  width?: number
  showVerticalLine?: boolean
  verticalLinePosition?: number
  onChartReady?: (chart: import('chart.js').Chart<T>) => void
  plugins?: Plugin<T>[]
}

export interface ChartTheme {
  gridColor: string
  tickColor: string
  legendColor: string
  tooltipBackground: string
  tooltipText: string
  fontFamily: string
  textColor?: string
  axisColor?: string
  backgroundColor?: string
}

export interface ChartDisplayOptions {
  showConfidenceInterval: boolean
  showBaseModel: boolean
  showDeltaPlot: boolean
}

export const CHART_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#84cc16',
  '#14b8a6',
] as const

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] as string
}

export interface ChartExportOptions {
  filename: string
  format: 'svg' | 'png'
  backgroundColor?: string
  width?: number
  height?: number
}

export interface SmallMultipleConfig {
  vitalParam: string
  compFactor: string
  fileName: string
  showTitle?: boolean
  showAxes?: boolean
  showLegend?: boolean
  compact?: boolean
}

export interface ForestPlotConfig {
  showNullLine?: boolean
  nullLineValue?: number
  showDiamond?: boolean
  diamondHeight?: number
  pointSize?: number
  showCI?: boolean
  horizontal?: boolean
}

export interface TimeSeriesConfig {
  showConfidenceInterval?: boolean
  showBaseModel?: boolean
  showVerticalLine?: boolean
  verticalLineX?: number
  smoothing?: 'none' | 'bezier' | 'step'
  tension?: number
}
