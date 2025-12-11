import type { ChartData } from 'chart.js'
import type {
  CompFactorCode,
  TimeRange,
  ChartDisplayOptions,
  VisualizationDataRow,
  TransfusionDataRow,
} from '@/types'
import { CHART_COLORS, getChartColor } from '@/types/charts'

/**
 * Filter data rows by time range
 *
 * @param rows - Array of data rows with TimeFromTransfusion property
 * @param timeRange - Tuple of [minTime, maxTime] in minutes
 * @returns Filtered array of rows within the time range
 */
export function filterByTimeRange<T extends { TimeFromTransfusion: number }>(
  rows: T[],
  timeRange: TimeRange
): T[] {
  const [minTime, maxTime] = timeRange
  return rows.filter(
    (row) => row.TimeFromTransfusion >= minTime && row.TimeFromTransfusion <= maxTime
  )
}

/**
 * Helper to add transparency to hex color
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Prepare Chart.js datasets for visualization charts
 *
 * Creates line chart data with confidence interval bands for multiple comparison groups.
 * Each comparison group gets:
 * - A main line (full model prediction or delta values)
 * - Optional confidence interval band (fill area)
 * - Optional base model line (if showBaseModel is enabled)
 *
 * When showDeltaPlot is true, uses Delta_Full/Delta_Lower/Delta_Upper columns
 * for showing change from baseline instead of absolute values.
 *
 * @param rows - Visualization data rows
 * @param comparisonColumn - The comparison factor being analyzed
 * @param selectedComparisons - Array of selected comparison values to display
 * @param timeRange - Time range to filter data
 * @param displayOptions - Chart display configuration
 * @returns Chart.js compatible ChartData object
 */
export function prepareVisualizationChartData(
  rows: VisualizationDataRow[],
  _comparisonColumn: CompFactorCode,
  selectedComparisons: (string | number)[],
  timeRange: TimeRange,
  displayOptions: ChartDisplayOptions
): ChartData<'line'> {
  // Filter by time range
  const filteredRows = filterByTimeRange(rows, timeRange)

  // Group data by comparison value
  const groupedData = new Map<string | number, VisualizationDataRow[]>()
  for (const row of filteredRows) {
    if (selectedComparisons.includes(row.CompValue)) {
      if (!groupedData.has(row.CompValue)) {
        groupedData.set(row.CompValue, [])
      }
      groupedData.get(row.CompValue)!.push(row)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datasets: any[] = []

  // Determine which values to use based on display mode
  const useDelta = displayOptions.showDeltaPlot

  // Create datasets for each selected comparison
  selectedComparisons.forEach((compValue, index) => {
    const data = groupedData.get(compValue)
    if (!data || data.length === 0) return

    // Sort by time for proper line rendering
    const sortedData = [...data].sort((a, b) => a.TimeFromTransfusion - b.TimeFromTransfusion)

    const color = getChartColor(index)
    const transparentColor = hexToRgba(color, 0.15)

    // Get the appropriate y-values based on mode
    const getYValue = (row: VisualizationDataRow) =>
      useDelta ? row.Delta_Full : row.PredVal_Full
    const getUpperValue = (row: VisualizationDataRow) =>
      useDelta ? (row.Delta_Upper ?? row.Delta_Full) : row.Upper_Full
    const getLowerValue = (row: VisualizationDataRow) =>
      useDelta ? (row.Delta_Lower ?? row.Delta_Full) : row.Lower_Full
    const getBaseValue = (row: VisualizationDataRow) =>
      useDelta ? row.Delta_Base : row.PredVal_Base

    // Confidence interval bands - upper line first (no fill), then lower line fills to upper
    if (displayOptions.showConfidenceInterval) {
      datasets.push({
        label: `${compValue} (Upper CI)`,
        data: sortedData.map((row) => ({
          x: row.TimeFromTransfusion,
          y: getUpperValue(row),
        })),
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 0,
        tension: 0.4,
        parsing: false,
        hidden: false,
        showLine: true,
      })

      // Lower CI fills UP to the previous dataset (upper CI)
      datasets.push({
        label: `${compValue} (Lower CI)`,
        data: sortedData.map((row) => ({
          x: row.TimeFromTransfusion,
          y: getLowerValue(row),
        })),
        borderColor: 'transparent',
        backgroundColor: transparentColor,
        fill: '-1', // Fill to previous dataset (upper CI)
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 0,
        tension: 0.4,
        parsing: false,
        hidden: false,
        showLine: true,
      })
    }

    // Main prediction line (full model)
    datasets.push({
      label: String(compValue),
      data: sortedData.map((row) => ({
        x: row.TimeFromTransfusion,
        y: getYValue(row),
      })),
      borderColor: color,
      backgroundColor: color,
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
      tension: 0.4,
      parsing: false,
    })

    // Base model line (if enabled)
    const hasBaseData = sortedData[0] && getBaseValue(sortedData[0]) !== undefined
    if (displayOptions.showBaseModel && hasBaseData) {
      datasets.push({
        label: `${compValue} (Base)`,
        data: sortedData.map((row) => ({
          x: row.TimeFromTransfusion,
          y: getBaseValue(row),
        })),
        borderColor: color,
        backgroundColor: color,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 1,
        borderDash: [5, 5],
        tension: 0.4,
        parsing: false,
      })
    }
  })

  return {
    datasets,
  }
}

/**
 * Prepare Chart.js datasets for transfusion effect charts
 *
 * Creates line chart data showing the overall effect of RBC transfusions on vital parameters.
 * Unlike visualization charts, this shows a single vital parameter's response to transfusion
 * without comparison groups.
 *
 * @param rows - Transfusion data rows for a specific vital parameter
 * @param timeRange - Time range to filter data
 * @param displayOptions - Chart display configuration
 * @returns Chart.js compatible ChartData object
 */
export function prepareTransfusionChartData(
  rows: TransfusionDataRow[],
  timeRange: TimeRange,
  displayOptions: ChartDisplayOptions
): ChartData<'line'> {
  // Filter by time range
  const filteredRows = filterByTimeRange(rows, timeRange)

  // Sort by time
  const sortedData = [...filteredRows].sort(
    (a, b) => a.TimeFromTransfusion - b.TimeFromTransfusion
  )

  if (sortedData.length === 0) {
    return { datasets: [] }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datasets: any[] = []
  const color = CHART_COLORS[0] // Use primary color
  const transparentColor = hexToRgba(color, 0.15)

  // Confidence interval bands - upper line first (no fill), then lower line fills to upper
  if (displayOptions.showConfidenceInterval) {
    datasets.push({
      label: 'Upper CI',
      data: sortedData.map((row) => ({
        x: row.TimeFromTransfusion,
        y: row.Upper_Full,
      })),
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 0,
      borderWidth: 0,
      tension: 0.4,
      parsing: false,
      hidden: false,
      showLine: true,
    })

    // Lower CI fills UP to the previous dataset (upper CI)
    datasets.push({
      label: 'Lower CI',
      data: sortedData.map((row) => ({
        x: row.TimeFromTransfusion,
        y: row.Lower_Full,
      })),
      borderColor: 'transparent',
      backgroundColor: transparentColor,
      fill: '-1', // Fill to previous dataset (upper CI)
      pointRadius: 0,
      pointHoverRadius: 0,
      borderWidth: 0,
      tension: 0.4,
      parsing: false,
      hidden: false,
      showLine: true,
    })
  }

  // Main prediction line (full model)
  datasets.push({
    label: 'Full Model',
    data: sortedData.map((row) => ({
      x: row.TimeFromTransfusion,
      y: row.PredVal_Full,
    })),
    borderColor: color,
    backgroundColor: color,
    fill: false,
    pointRadius: 0,
    pointHoverRadius: 4,
    borderWidth: 2,
    tension: 0.4,
    parsing: false,
  })

  // Base model line (if enabled and available)
  if (displayOptions.showBaseModel && sortedData[0]?.PredVal_Base !== undefined) {
    datasets.push({
      label: 'Base Model',
      data: sortedData.map((row) => ({
        x: row.TimeFromTransfusion,
        y: row.PredVal_Base,
      })),
      borderColor: color,
      backgroundColor: color,
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 1,
      borderDash: [5, 5],
      tension: 0.4,
      parsing: false,
    })
  }

  return {
    datasets,
  }
}

export default {
  filterByTimeRange,
  prepareVisualizationChartData,
  prepareTransfusionChartData,
}
