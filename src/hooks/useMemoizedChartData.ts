import { useMemo } from 'react'
import { prepareVisualizationChartData, prepareTransfusionChartData } from '@/components/charts'
import type {
  VisualizationDataRow,
  TransfusionDataRow,
} from '@/types/data'
import type { CompFactorCode } from '@/types/vitals'
import type { ChartDisplayOptions } from '@/types/store'

export type TimeRange = [number, number]

export function useMemoizedVisualizationData(
  rows: VisualizationDataRow[] | null,
  comparisonColumn: CompFactorCode | null,
  selectedComparisons: (string | number)[],
  timeRange: TimeRange,
  displayOptions: ChartDisplayOptions
) {
  const timeMin = timeRange[0]
  const timeMax = timeRange[1]
  const showCI = displayOptions.showConfidenceInterval
  const showBase = displayOptions.showBaseModel
  const showDelta = displayOptions.showDeltaPlot

  return useMemo(() => {
    if (!rows || !comparisonColumn || rows.length === 0) {
      return null
    }

    const range: TimeRange = [timeMin, timeMax]
    const options: ChartDisplayOptions = {
      showConfidenceInterval: showCI,
      showBaseModel: showBase,
      showDeltaPlot: showDelta
    }

    return prepareVisualizationChartData(
      rows,
      comparisonColumn,
      selectedComparisons,
      range,
      options
    )
  }, [
    rows,
    comparisonColumn,
    selectedComparisons,
    timeMin,
    timeMax,
    showCI,
    showBase,
    showDelta
  ])
}

export function useMemoizedTransfusionData(
  rows: TransfusionDataRow[] | null,
  timeRange: TimeRange,
  displayOptions: ChartDisplayOptions
) {
  const timeMin = timeRange[0]
  const timeMax = timeRange[1]
  const showCI = displayOptions.showConfidenceInterval
  const showBase = displayOptions.showBaseModel
  const showDelta = displayOptions.showDeltaPlot

  return useMemo(() => {
    if (!rows || rows.length === 0) {
      return null
    }

    const range: TimeRange = [timeMin, timeMax]
    const options: ChartDisplayOptions = {
      showConfidenceInterval: showCI,
      showBaseModel: showBase,
      showDeltaPlot: showDelta
    }
    return prepareTransfusionChartData(rows, range, options)
  }, [
    rows,
    timeMin,
    timeMax,
    showCI,
    showBase,
    showDelta
  ])
}

export function useMemoizedTimeFilter<T extends { TimeFromTransfusion: number }>(
  data: T[] | null,
  timeRange: TimeRange
): T[] {
  const timeMin = timeRange[0]
  const timeMax = timeRange[1]

  return useMemo(() => {
    if (!data) return []

    return data.filter(
      row => row.TimeFromTransfusion >= timeMin && row.TimeFromTransfusion <= timeMax
    )
  }, [data, timeMin, timeMax])
}

export function useMemoizedGroupBy<T extends Record<string, unknown>>(
  data: T[] | null,
  groupKey: keyof T
): Map<unknown, T[]> {
  return useMemo(() => {
    const grouped = new Map<unknown, T[]>()

    if (!data) return grouped

    for (const row of data) {
      const key = row[groupKey]
      const existing = grouped.get(key) ?? []
      existing.push(row)
      grouped.set(key, existing)
    }

    return grouped
  }, [data, groupKey])
}

export function useMemoizedUniqueValues<T extends Record<string, unknown>>(
  data: T[] | null,
  columnKey: keyof T
): unknown[] {
  return useMemo(() => {
    if (!data) return []

    const uniqueSet = new Set<unknown>()
    for (const row of data) {
      uniqueSet.add(row[columnKey])
    }

    return Array.from(uniqueSet)
  }, [data, columnKey])
}
