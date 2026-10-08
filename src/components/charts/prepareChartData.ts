import type { ChartData } from 'chart.js'
import type {
  CompFactorCode,
  TimeRange,
  ChartDisplayOptions,
  VisualizationDataRow,
  TransfusionDataRow,
} from '@/types'
import { CHART_COLORS, getChartColor } from '@/types/charts'

/** Keep the exported time grid, including both selected endpoints. */
export function filterByTimeRange<T extends { TimeFromTransfusion: number }>(
  rows: T[],
  timeRange: TimeRange
): T[] {
  const [minTime, maxTime] = timeRange
  return rows.filter(
    (row) => row.TimeFromTransfusion >= minTime && row.TimeFromTransfusion <= maxTime
  )
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Map exported values without resampling or adding spline interpolation.
 * Missing values remain explicit gaps, including partially missing intervals.
 *
 * Delta_Lower/Delta_Upper in the current exports are shifted absolute limits,
 * not confidence limits for a change. Only absolute levels may show bands.
 */
function prepareModelDatasets(
  rows: TransfusionDataRow[],
  options: ChartDisplayOptions,
  color: string,
  labels: { full: string; base: string; upper: string; lower: string }
) {
  const sortedRows = [...rows].sort((a, b) => a.TimeFromTransfusion - b.TimeFromTransfusion)
  // Chart.js accepts y: null to retain the time coordinate of a missing value.
  // Its default line-chart point type only declares a numeric y.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datasets: any[] = []
  const lineOptions = { tension: 0, spanGaps: false, parsing: false, pointRadius: 0 }
  const getBase = (row: TransfusionDataRow) =>
    finiteOrNull(options.showDeltaPlot ? row.Delta_Base : row.PredVal_Base)

  if (options.showConfidenceInterval && !options.showDeltaPlot) {
    const hasInterval = (row: TransfusionDataRow) =>
      finiteOrNull(row.PredVal_Full) !== null &&
      finiteOrNull(row.Lower_Full) !== null &&
      finiteOrNull(row.Upper_Full) !== null

    const bandOptions = {
      ...lineOptions,
      borderColor: 'transparent',
      borderWidth: 0,
      pointHoverRadius: 0,
      hidden: false,
      showLine: true,
    }
    datasets.push({
      ...bandOptions,
      label: labels.upper,
      data: sortedRows.map((row) => ({
        x: row.TimeFromTransfusion,
        y: hasInterval(row) ? row.Upper_Full : null,
      })),
      backgroundColor: 'transparent',
      fill: false,
    })
    datasets.push({
      ...bandOptions,
      label: labels.lower,
      data: sortedRows.map((row) => ({
        x: row.TimeFromTransfusion,
        y: hasInterval(row) ? row.Lower_Full : null,
      })),
      backgroundColor: hexToRgba(color, 0.15),
      fill: '-1',
    })
  }

  datasets.push({
    ...lineOptions,
    label: labels.full,
    data: sortedRows.map((row) => ({
      x: row.TimeFromTransfusion,
      y: finiteOrNull(options.showDeltaPlot ? row.Delta_Full : row.PredVal_Full),
    })),
    borderColor: color,
    backgroundColor: color,
    fill: false,
    pointHoverRadius: 4,
    borderWidth: 2,
  })

  // Never substitute full-model predictions for missing base-model predictions.
  if (options.showBaseModel && sortedRows.some((row) => getBase(row) !== null)) {
    datasets.push({
      ...lineOptions,
      label: labels.base,
      data: sortedRows.map((row) => ({ x: row.TimeFromTransfusion, y: getBase(row) })),
      borderColor: color,
      backgroundColor: color,
      fill: false,
      pointHoverRadius: 4,
      borderWidth: 1,
      borderDash: [5, 5],
    })
  }
  return datasets
}

/**
 * Prepare factor trajectories with colors determined by the entire category
 * universe, before time filtering or category selection. Selection order cannot
 * change a category's color.
 */
export function prepareVisualizationChartData(
  rows: VisualizationDataRow[],
  _comparisonColumn: CompFactorCode,
  selectedComparisons: (string | number)[],
  timeRange: TimeRange,
  displayOptions: ChartDisplayOptions
): ChartData<'line'> {
  const categories = [...new Set(rows.map((row) => row.CompValue))].sort((a, b) =>
    String(a).localeCompare(String(b), 'en', { numeric: true }) ||
    String(a).localeCompare(String(b), 'en') ||
    (typeof a).localeCompare(typeof b)
  )
  const colorIndices = new Map(categories.map((category, index) => [category, index]))
  const selected = new Set(selectedComparisons)
  const groupedData = new Map<string | number, VisualizationDataRow[]>()
  for (const row of filterByTimeRange(rows, timeRange)) {
    if (!selected.has(row.CompValue)) continue
    const group = groupedData.get(row.CompValue) ?? []
    group.push(row)
    groupedData.set(row.CompValue, group)
  }

  return {
    datasets: [...selected].flatMap((category) => {
      const group = groupedData.get(category)
      if (!group?.length) return []
      return prepareModelDatasets(group, displayOptions, getChartColor(colorIndices.get(category)!), {
        full: String(category),
        base: `${category} (Base)`,
        upper: `${category} (Upper CI)`,
        lower: `${category} (Lower CI)`,
      })
    }),
  }
}

/** Prepare the main trajectory or exported change from baseline. */
export function prepareTransfusionChartData(
  rows: TransfusionDataRow[],
  timeRange: TimeRange,
  displayOptions: ChartDisplayOptions
): ChartData<'line'> {
  const filteredRows = filterByTimeRange(rows, timeRange)
  return {
    datasets: filteredRows.length ? prepareModelDatasets(
      filteredRows,
      displayOptions,
      CHART_COLORS[0],
      { full: 'Full Model', base: 'Base Model', upper: 'Upper CI', lower: 'Lower CI' }
    ) : [],
  }
}

export default {
  filterByTimeRange,
  prepareVisualizationChartData,
  prepareTransfusionChartData,
}
