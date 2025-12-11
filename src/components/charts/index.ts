/**
 * Charts Module - Barrel Export
 *
 * This module provides reusable Chart.js components and utilities for the
 * SCANDAT Dashboard. It includes themed chart wrappers, data preparation
 * helpers, export functionality, and custom Chart.js plugins.
 *
 * @module components/charts
 */

// Core chart component
export { BaseChart, default as Chart } from './BaseChart'

// Chart configuration (registers Chart.js components)
export { ChartJS } from './chartConfig'

// Data preparation utilities
export {
  filterByTimeRange,
  prepareVisualizationChartData,
  prepareTransfusionChartData,
} from './prepareChartData'

// Export functionality
export { exportChartAsSVG } from './exportChart'

// Custom plugins
export { verticalLinePlugin } from './plugins/verticalLinePlugin'
