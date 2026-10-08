import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FactorObservedSummaryRow, FactorModelSummaryRow } from '@/types'
import { FactorForestPlot } from '../FactorForestPlot'
import { SummaryTableB } from '../SummaryTableB'

const chart = vi.hoisted(() => ({ render: vi.fn() }))
vi.mock('@/components/charts', () => ({
  BaseChart: (props: unknown) => { chart.render(props); return <div /> },
}))

const model = (values: Partial<FactorModelSummaryRow>) => ({
  Abbreviation: 'ARTm', FactorName: 'DonorParity', FactorCategory: '0',
  ...values,
}) as FactorModelSummaryRow
const observed = (values: Partial<FactorObservedSummaryRow>) => ({
  Abbreviation: 'ARTm', FactorName: 'DonorParity', FactorCategory: '0',
  ...values,
}) as FactorObservedSummaryRow

function renderChart(models: FactorModelSummaryRow[], observations: FactorObservedSummaryRow[], showBaseModel = false, showFullModel = true) {
  render(<FactorForestPlot factorCode="DonorParity" factorName="Donor Parity"
    modelData={models} observedData={observations} showBaseModel={showBaseModel} showFullModel={showFullModel} />)
  return chart.render.mock.calls[chart.render.mock.calls.length - 1]![0]
}

afterEach(() => { cleanup(); chart.render.mockClear() })

describe('factor point-estimate display', () => {
  it('ignores legacy limits and hidden series when setting the range', () => {
    const props = renderChart([
      model({ Base_Diff: 5000, Full_Diff: 2, Full_Diff_LCL: -9000, Full_Diff_UCL: 9000 }),
    ], [observed({ Diff_Mean: 1, Diff_LCL: -8000, Diff_UCL: 8000 })])
    expect(props.type).toBe('line')
    expect(props.data.datasets.map((series: { data: unknown[] }) => series.data)).toEqual([[1], [2]])
    expect(props.data.datasets.every((series: { showLine: boolean }) => series.showLine === false)).toBe(true)
    expect(props.options.scales.y.min).toBe(-0.3)
    expect(props.options.scales.y.max).toBe(2.3)
    expect(props.options.scales.y.title).toEqual({ display: true, text: 'Change (mmHg)' })
    expect(props.plugins.map((plugin: { id: string }) => plugin.id)).toEqual(['zeroLine'])
    const tooltip = props.options.plugins.tooltip.callbacks.label({ dataset: props.data.datasets[1], dataIndex: 0 })
    expect(tooltip).toBe('No-interaction model (fully adjusted): 2 mmHg')
    expect(tooltip).not.toMatch(/CI|9000|\[/)
  })

  it('uses only observed values when both model series are hidden and includes zero for negative values', () => {
    const props = renderChart([model({ Base_Diff: 500, Full_Diff: -700 })], [observed({ Diff_Mean: -2 })], false, false)
    expect(props.data.datasets).toHaveLength(1)
    expect(props.options.scales.y.min).toBe(-2.3)
    expect(props.options.scales.y.max).toBe(0.3)
  })

  it('preserves zeros and category gaps without using intervals as fallback data', () => {
    const props = renderChart([
      model({ FactorCategory: '0', Base_Diff: 0, Full_Diff: Number.NaN, Full_Diff_LCL: -3, Full_Diff_UCL: 3 }),
      model({ FactorCategory: '1', Base_Diff: Number.POSITIVE_INFINITY, Full_Diff: 0 }),
    ], [], true)
    expect(props.data.datasets.map((series: { data: unknown[] }) => series.data)).toEqual([
      [null, null], [0, null], [null, 0],
    ])
    expect(props.data.labels).toEqual(['Parity 0 (includes male donors)', 'Parity 1'])
    const tooltip = props.options.plugins.tooltip.callbacks.label({ dataset: props.data.datasets[2], dataIndex: 0 })
    expect(tooltip).toBe('No-interaction model (fully adjusted): unavailable')
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('No-interaction model (base)')
  })

  it('labels native percentage differences as percentage points without rescaling', () => {
    const props = renderChart([model({ Abbreviation: 'FIO2', Full_Diff: -0.25 })], [])
    expect(props.options.scales.y.title.text).toBe('Change (percentage points)')
    expect(props.data.datasets[1].data).toEqual([-0.25])
    expect(props.options.plugins.tooltip.callbacks.label({ dataset: props.data.datasets[1], dataIndex: 0 }))
      .toBe('No-interaction model (fully adjusted): -0.25 percentage points')
  })

  it('retains model-only factors and categories in the table, with no confidence interval output', () => {
    render(<SummaryTableB observedData={[observed({ Diff_Mean: 0 })]} modelData={[
      model({ FactorCategory: '1', Full_Diff: 2, Full_Diff_LCL: -7777, Full_Diff_UCL: 7777 }),
      model({ FactorName: 'DonorSex', FactorCategory: '1', Full_Diff: 3 }),
    ]} />)
    expect(screen.getByRole('heading', { name: 'Donor Sex' })).toBeDefined()
    const zeroRow = screen.getByRole('cell', { name: 'Parity 0 (includes male donors)' }).closest('tr')!
    expect(within(zeroRow).getByText('0.00')).toBeDefined()
    expect(within(zeroRow).getByText('—')).toBeDefined()
    const modelOnlyRow = screen.getByRole('cell', { name: 'Parity 1' }).closest('tr')!
    expect(within(modelOnlyRow).getByText('2.00')).toBeDefined()
    expect(within(modelOnlyRow).getByText('—')).toBeDefined()
    expect(screen.getAllByRole('columnheader', { name: /No-interaction model/ })).toHaveLength(2)
    expect(screen.queryByText(/7777/)).toBeNull()
    expect(screen.getByText(/These models differ from the interaction models/)).toBeDefined()
  })

  it('prints missing non-finite table estimates as unavailable while retaining zero', () => {
    render(<SummaryTableB observedData={[observed({ Diff_Mean: Number.NaN })]}
      modelData={[model({ Full_Diff: 0 })]} />)
    const row = screen.getByRole('cell', { name: 'Parity 0 (includes male donors)' }).closest('tr')!
    expect(within(row).getByText('—')).toBeDefined()
    expect(within(row).getByText('0.00')).toBeDefined()
  })
})
