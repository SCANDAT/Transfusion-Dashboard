import type { ChartData, ChartOptions, ChartType, Plugin } from 'chart.js'

/**
 * Base Chart Props
 */
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

/**
 * Chart Theme Configuration
 */
export interface ChartTheme {
  gridColor: string
  tickColor: string
  legendColor: string
  tooltipBackground: string
  tooltipText: string
  fontFamily: string
  // Legacy properties for backwards compatibility
  textColor?: string
  axisColor?: string
  backgroundColor?: string
}

/**
 * Chart Display Options (user-controllable)
 */
export interface ChartDisplayOptions {
  showConfidenceInterval: boolean
  showBaseModel: boolean
  showDeltaPlot: boolean
}

/**
 * Chart Color Palette
 */
export const CHART_COLORS = [
  '#6366f1',  // Indigo (primary)
  '#f59e0b',  // Amber
  '#10b981',  // Emerald
  '#ef4444',  // Red
  '#8b5cf6',  // Violet
  '#06b6d4',  // Cyan
  '#f97316',  // Orange
  '#ec4899',  // Pink
  '#84cc16',  // Lime
  '#14b8a6',  // Teal
] as const

/**
 * Get chart color by index (cycles through palette)
 */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] as string
}

/**
 * Chart Export Options
 */
export interface ChartExportOptions {
  filename: string
  format: 'svg' | 'png'
  backgroundColor?: string
  width?: number
  height?: number
}

/**
 * Small Multiple Chart Configuration
 */
export interface SmallMultipleConfig {
  vitalParam: string
  compFactor: string
  fileName: string
  showTitle?: boolean
  showAxes?: boolean
  showLegend?: boolean
  compact?: boolean
}

/**
 * Forest Plot Configuration
 */
export interface ForestPlotConfig {
  showNullLine?: boolean
  nullLineValue?: number
  showDiamond?: boolean
  diamondHeight?: number
  pointSize?: number
  showCI?: boolean
  horizontal?: boolean
}

/**
 * Time Series Chart Configuration
 */
export interface TimeSeriesConfig {
  showConfidenceInterval?: boolean
  showBaseModel?: boolean
  showVerticalLine?: boolean
  verticalLineX?: number
  smoothing?: 'none' | 'bezier' | 'step'
  tension?: number
}
