import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DescriptiveStatisticsTab } from '../index'
import { DonorStats } from '../DonorStats'

// Entirely synthetic category counts, including categories the old UI recoded as parous.
const stats = vi.hoisted(() => ({
  uniquePatients: 10,
  totalUnits: 100,
  patientAge: { mean: 55, median: 55, q1: 45, q3: 65, min: 25, max: 85 },
  patientSex: [], ageGroups: [], rbcUnitsPerPatient: [],
  donorHb: [], donorSex: [], storage: [], donationWeekday: [],
  donorParity: [
    { parity: '0', count: 40, percentage: 40 },
    { parity: '1', count: 30, percentage: 30 },
    { parity: 'Unknown', count: 20, percentage: 20 },
    { parity: '.', count: 10, percentage: 10 },
  ],
}))
vi.mock('@/hooks/useCSVData', () => ({
  useAsyncData: () => ({ data: stats, loading: false, error: null }),
}))
vi.mock('@/components/charts', () => ({
  BaseChart: ({ data }: { data: { labels?: unknown[]; datasets: { data: unknown[] }[] } }) => (
    <div data-testid="chart">{JSON.stringify(data)}</div>
  ),
}))
afterEach(cleanup)

describe('donor parity displays', () => {
  it('uses the same faithful categories and unchanged counts in the active table and pie chart', () => {
    render(<DescriptiveStatisticsTab />)
    const zero = screen.getByText('Parity 0 (includes male donors)')
    const table = zero.closest('table')!
    expect(within(table).getByText('Unknown')).toBeDefined()
    expect(within(table).getByText('Missing')).toBeDefined()
    expect(within(table).queryByText('Parous')).toBeNull()
    expect(within(zero.closest('tr')!).getByText('40')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Expand All Charts' }))
    const chart = screen.getAllByTestId('chart').find(element => element.textContent?.includes('Parity 0'))!
    expect(JSON.parse(chart.textContent!).labels).toEqual([
      'Parity 0 (includes male donors)', 'Parity 1', 'Unknown', 'Missing',
    ])
    expect(JSON.parse(chart.textContent!).datasets[0].data).toEqual([40, 30, 20, 10])
  })

  it('does not describe the alternate donor panel as female-only', () => {
    render(<DonorStats donorHb={[]} donorSex={[]} donorParity={stats.donorParity} donationWeekday={[]} />)
    expect(screen.getByRole('heading', { name: 'Donor Parity' })).toBeDefined()
    expect(screen.queryByText('Female Donor Parity')).toBeNull()
    expect(screen.getByText('Unknown')).toBeDefined()
    expect(screen.getByText('Missing')).toBeDefined()
  })
})
