import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { Chart, ChartData, ChartEvent, ChartOptions, LegendElement } from 'chart.js'
import type { TransfusionDataRow, VisualizationData } from '@/types'
import { PlotPair } from '@/components/tabs/RBCTransfusions/PlotPair'
import { EffectCharts } from '@/components/tabs/ComponentFactorEffects/EffectCharts'

const mocks = vi.hoisted(() => ({ capture: vi.fn() }))
vi.mock('@/components/charts', async () => {
  const preparation = await import('../prepareChartData')
  return {
    ...preparation,
    exportChartAsPNG: vi.fn(),
    BaseChart: (props: unknown) => {
      mocks.capture(props)
      return <div data-testid="chart" />
    },
  }
})

const row: TransfusionDataRow = {
  VitalParam: 'ARTm', TimeFromTransfusion: 0, PredVal_Full: 10,
  Lower_Full: 9, Upper_Full: 11, PredVal_Base: 12,
  Delta_Full: 0, Delta_Base: 1, Delta_Lower: -1, Delta_Upper: 1,
}
const options = { showConfidenceInterval: true, showBaseModel: true, showDeltaPlot: false }

function lastChart() {
  const calls = mocks.capture.mock.calls
  return calls[calls.length - 1]![0] as { data: ChartData<'line'>; options: ChartOptions<'line'> }
}

const factorData: VisualizationData = {
  rows: [1, 2].map(CompValue => ({ ...row, CompValue, CompFactor: 'Storage_Cat' })),
  comparisonColumn: 'Storage_Cat', comparisonValues: [1, 2],
  metadata: {
    vitalParam: 'ARTm', vitalName: 'Mean arterial pressure', compFactor: 'Storage_Cat',
    compName: 'Storage duration', yLabel: 'Mean arterial pressure (mmHg)',
    deltaYLabel: 'Change in mean arterial pressure (mmHg)', timeRange: [-720, 720], dataPoints: 2,
  },
}

beforeEach(() => {
  cleanup()
  mocks.capture.mockClear()
})

describe('trajectory chart consumers', () => {
  it('wires the RBC relative mode to point estimates and explains why no confidence band is shown', () => {
    render(<PlotPair vitalParam="ARTm" transfusionData={[row]} loessData={[]}
      timeRange={[-60, 60]} displayOptions={options} modelMode="relative"
      chartDisplay="model" useFlexibleHeight={false} />)
    expect(lastChart().data.datasets.map(ds => ds.label)).toEqual(['Full Model', 'Base Model'])
    expect(screen.getByRole('note')).toHaveTextContent('Confidence intervals for change are unavailable')
    expect(screen.getByRole('button', { name: 'Export PNG' })).toBeInTheDocument()
  })

  it('labels LOESS values as standardized rather than physiological measurements', () => {
    render(<PlotPair vitalParam="ARTm" transfusionData={[]} loessData={[{
      TimeFromTransfusion: 0, VitalParam: 'ARTm', Pred: 0.123,
    }]} timeRange={[-60, 60]} displayOptions={options} modelMode="absolute"
      chartDisplay="loess" useFlexibleHeight={false} />)
    expect(lastChart().options.scales?.y?.title?.text).toBe('Standardized value (z-score)')
    expect(lastChart().data.datasets[0]?.data).toEqual([{ x: 0, y: 0.123 }])
    expect(lastChart().data.datasets[0]?.tension).toBe(0)
    expect(screen.getByText('Standardized Observations (LOESS)')).toBeInTheDocument()
  })

  it('wires factor relative mode to point estimates with the same explanation', () => {
    render(<EffectCharts data={factorData} selectedComparisons={[1, 2]} timeRange={[-60, 60]}
      displayOptions={{ ...options, showDeltaPlot: true }} />)
    expect(lastChart().data.datasets.some(ds => ds.label?.includes('CI'))).toBe(false)
    expect(screen.getByRole('note')).toHaveTextContent('Confidence intervals for change are unavailable')
  })

  it('uses real dataset indices and toggles a whole category with its interval and base model', () => {
    render(<EffectCharts data={factorData} selectedComparisons={[2, 1]} timeRange={[-60, 60]}
      displayOptions={options} />)
    const { data, options: chartOptions } = lastChart()
    const visible = data.datasets.map(() => true)
    const chart = {
      data,
      isDatasetVisible: (index: number) => visible[index],
      setDatasetVisibility: vi.fn((index: number, value: boolean) => { visible[index] = value }),
      update: vi.fn(),
    }
    const legend = chartOptions.plugins!.legend!
    const fakeChart = chart as unknown as Chart
    const items = legend.labels!.generateLabels!(fakeChart)
    expect(items.map(item => item.datasetIndex)).toEqual([2, 6])
    expect(items.map(item => item.text)).toEqual(['10-19 days', '<10 days'])
    const fakeLegend = { chart } as unknown as LegendElement<'line'>
    legend.onClick!.call(fakeLegend, {} as ChartEvent, items[0]!, fakeLegend)
    expect(visible).toEqual([false, false, false, false, true, true, true, true])
    expect(chart.update).toHaveBeenCalledOnce()
    expect(legend.labels!.generateLabels!(fakeChart).map(item => item.hidden)).toEqual([true, false])
  })
})
