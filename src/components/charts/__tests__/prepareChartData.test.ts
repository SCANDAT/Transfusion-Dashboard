import { describe, expect, it } from 'vitest'
import type { ChartData } from 'chart.js'
import type { ChartDisplayOptions, TransfusionDataRow, VisualizationDataRow } from '@/types'
import { filterByTimeRange, prepareTransfusionChartData, prepareVisualizationChartData } from '../prepareChartData'

const options: ChartDisplayOptions = {
  showConfidenceInterval: true,
  showBaseModel: true,
  showDeltaPlot: false,
}

function row(time: number, values: Partial<TransfusionDataRow> = {}): TransfusionDataRow {
  return {
    TimeFromTransfusion: time, VitalParam: 'ARTm',
    PredVal_Full: 10, Lower_Full: 8, Upper_Full: 12,
    PredVal_Base: 11, Delta_Full: 2, Delta_Base: 3,
    Delta_Lower: 0, Delta_Upper: 4, ...values,
  }
}

function factorRow(category: string | number, time: number, values: Partial<TransfusionDataRow> = {}): VisualizationDataRow {
  return { ...row(time, values), CompFactor: 'Storage_Cat', CompValue: category }
}

function dataset(chart: ChartData<'line'>, label: string) {
  const result = chart.datasets.find(item => item.label === label)
  expect(result, label).toBeDefined()
  return result!
}

// Simulate nullable fields received from a CSV parser whose row types are numeric.
const missing = null as unknown as number

describe('exported trajectory display', () => {
  it('retains every selected time point and exact value, including zero and range endpoints', () => {
    const rows = [
      row(720, { PredVal_Full: 1.23456789 }), row(-721),
      row(0, { PredVal_Full: 0, Lower_Full: -1, Upper_Full: 1 }),
      row(-720, { PredVal_Full: -1.23456789 }), row(721), row(60), row(-60),
    ]
    const original = structuredClone(rows)
    expect(filterByTimeRange(rows, [-720, 720])).toHaveLength(5)
    const chart = prepareTransfusionChartData(rows, [-720, 720], options)
    expect(dataset(chart, 'Full Model').data).toEqual([
      { x: -720, y: -1.23456789 }, { x: -60, y: 10 },
      { x: 0, y: 0 }, { x: 60, y: 10 }, { x: 720, y: 1.23456789 },
    ])
    chart.datasets.forEach(series => {
      expect(series.tension).toBe(0)
      expect(series.spanGaps).toBe(false)
    })
    expect(rows).toEqual(original)
  })

  it('preserves absolute level limits and the fill relationship', () => {
    const chart = prepareTransfusionChartData([row(0, { Lower_Full: 0, Upper_Full: 13.271828 })], [-1, 1], options)
    expect(dataset(chart, 'Upper CI').data).toEqual([{ x: 0, y: 13.271828 }])
    expect(dataset(chart, 'Lower CI').data).toEqual([{ x: 0, y: 0 }])
    expect(dataset(chart, 'Lower CI').fill).toBe('-1')
  })

  it('never shows shifted level limits as confidence intervals for change', () => {
    const chart = prepareTransfusionChartData([
      row(-60, { Delta_Full: 0, Delta_Base: 0 }), row(60),
    ], [-60, 60], { ...options, showDeltaPlot: true })
    expect(chart.datasets.map(series => series.label)).toEqual(['Full Model', 'Base Model'])
    expect(dataset(chart, 'Full Model').data).toEqual([{ x: -60, y: 0 }, { x: 60, y: 2 }])
    expect(dataset(chart, 'Base Model').data).toEqual([{ x: -60, y: 0 }, { x: 60, y: 3 }])
  })

  it('leaves both band edges missing when one bound is missing, without removing the estimate', () => {
    const chart = prepareTransfusionChartData([
      row(-1), row(0, { Lower_Full: missing }), row(1),
    ], [-1, 1], options)
    expect(dataset(chart, 'Upper CI').data).toEqual([{ x: -1, y: 12 }, { x: 0, y: null }, { x: 1, y: 12 }])
    expect(dataset(chart, 'Lower CI').data).toEqual([{ x: -1, y: 8 }, { x: 0, y: null }, { x: 1, y: 8 }])
    expect(dataset(chart, 'Full Model').data).toEqual([{ x: -1, y: 10 }, { x: 0, y: 10 }, { x: 1, y: 10 }])
  })

  it('retains missing and nonfinite predictions as gaps rather than zeros or connected segments', () => {
    const chart = prepareTransfusionChartData([
      row(-1, { PredVal_Full: missing }), row(0, { PredVal_Full: NaN }), row(1, { PredVal_Full: Infinity }),
    ], [-1, 1], options)
    for (const label of ['Full Model', 'Upper CI', 'Lower CI']) {
      expect(dataset(chart, label).data).toEqual([{ x: -1, y: null }, { x: 0, y: null }, { x: 1, y: null }])
    }
  })

  it('shows available base values even when the first is missing and never substitutes the full model', () => {
    const chart = prepareTransfusionChartData([
      row(-1, { PredVal_Base: undefined }), row(0, { PredVal_Base: 0 }), row(1, { PredVal_Base: missing }),
    ], [-1, 1], options)
    expect(dataset(chart, 'Base Model').data).toEqual([{ x: -1, y: null }, { x: 0, y: 0 }, { x: 1, y: null }])
    expect(prepareTransfusionChartData([row(0, { PredVal_Base: undefined })], [-1, 1], options)
      .datasets.some(series => series.label === 'Base Model')).toBe(false)
  })

  it('honors disabled level bands and base lines, and handles an empty time window', () => {
    const chart = prepareTransfusionChartData([row(0)], [-1, 1], {
      ...options, showConfidenceInterval: false, showBaseModel: false,
    })
    expect(chart.datasets.map(series => series.label)).toEqual(['Full Model'])
    expect(prepareTransfusionChartData([row(0)], [1, 2], options).datasets).toEqual([])
  })
})

describe('factor trajectory display', () => {
  it('keeps each category color when selecting, reordering, filtering time, or reordering rows', () => {
    const rows = [factorRow(10, 0), factorRow(1, -60), factorRow(2, 0), factorRow(1, 0)]
    const all = prepareVisualizationChartData(rows, 'Storage_Cat', [10, 2, 1], [-60, 0], options)
    const selected = prepareVisualizationChartData([...rows].reverse(), 'Storage_Cat', [2, 10], [0, 0], options)
    for (const label of ['2', '10']) {
      expect(dataset(selected, label).borderColor).toEqual(dataset(all, label).borderColor)
    }
    const narrow = prepareVisualizationChartData(rows, 'Storage_Cat', [1], [-60, -60], options)
    expect(dataset(narrow, '1').borderColor).toEqual(dataset(all, '1').borderColor)
    expect(dataset(all, '1').borderColor).not.toEqual(dataset(all, '2').borderColor)
  })

  it('does not display delta bands and retains a zero factor change', () => {
    const chart = prepareVisualizationChartData([
      factorRow('2', 0, { Delta_Full: 0 }), factorRow('2', 60),
    ], 'Storage_Cat', ['2'], [0, 60], { ...options, showDeltaPlot: true })
    expect(chart.datasets.map(series => series.label)).toEqual(['2', '2 (Base)'])
    expect(dataset(chart, '2').data).toEqual([{ x: 0, y: 0 }, { x: 60, y: 2 }])
  })

  it('preserves missing factor bounds as gaps and returns no unselected categories', () => {
    const chart = prepareVisualizationChartData([
      factorRow(1, 0), factorRow(2, 0, { Upper_Full: missing }),
    ], 'Storage_Cat', [2], [0, 60], options)
    expect(dataset(chart, '2 (Upper CI)').data).toEqual([{ x: 0, y: null }])
    expect(dataset(chart, '2 (Lower CI)').data).toEqual([{ x: 0, y: null }])
    expect(chart.datasets.every(series => series.label?.startsWith('2'))).toBe(true)
  })
})
