import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RBCTransfusionsTab } from '../index'
import { useDashboardStore } from '@/stores/dashboardStore'
import type { LoessMultiSpanRow } from '@/types'

const service = vi.hoisted(() => ({
  loadTransfusionData: vi.fn(), loadLoessMultiSpanData: vi.fn(),
  getAvailableVitalParams: vi.fn(), extractLoessForSpan: vi.fn(),
}))
vi.mock('@/services/dataService', () => service)
vi.mock('@/components/charts', async () => ({
  ...await import('@/components/charts/prepareChartData'),
  exportChartAsPNG: vi.fn(),
  BaseChart: () => <div data-testid="chart" />,
}))

beforeEach(() => {
  vi.resetAllMocks()
  useDashboardStore.setState({ transfusionSelectedVitals: ['ARTm'], availableVitals: ['ARTm'], error: null })
  service.getAvailableVitalParams.mockResolvedValue(['ARTm'])
  service.loadTransfusionData.mockResolvedValue([{
    VitalParam: 'ARTm', TimeFromTransfusion: 0, PredVal_Full: 10,
    Lower_Full: 9, Upper_Full: 11, Delta_Full: 0,
  }])
  service.loadLoessMultiSpanData.mockResolvedValue([])
  service.extractLoessForSpan.mockReturnValue([])
})
afterEach(cleanup)

describe('optional LOESS loading', () => {
  it('renders the default model without downloading the optional smoother', async () => {
    render(<RBCTransfusionsTab />)
    expect(await screen.findByText('Model Prediction (Absolute)')).toBeInTheDocument()
    expect(service.loadLoessMultiSpanData).not.toHaveBeenCalled()
    expect(screen.getAllByTestId('chart')).toHaveLength(1)
  })

  it('keeps the model visible while the optional smoother is loading', async () => {
    let finish: (rows: LoessMultiSpanRow[]) => void = () => undefined
    service.loadLoessMultiSpanData.mockReturnValue(new Promise<LoessMultiSpanRow[]>(resolve => { finish = resolve }))
    render(<RBCTransfusionsTab />)
    await screen.findByText('Model Prediction (Absolute)')
    fireEvent.click(screen.getByRole('button', { name: /^Both$/ }))
    expect(await screen.findByRole('status')).toHaveTextContent('Loading LOESS data')
    expect(screen.getByText('Model Prediction (Absolute)')).toBeInTheDocument()
    expect(service.loadLoessMultiSpanData).toHaveBeenCalledTimes(1)
    await act(async () => finish([]))
    expect(await screen.findByText('No LOESS data are available for this selection.')).toBeInTheDocument()
  })

  it('shows a retryable LOESS error without hiding the model', async () => {
    service.loadLoessMultiSpanData.mockRejectedValueOnce(new Error('Unavailable'))
    render(<RBCTransfusionsTab />)
    await screen.findByText('Model Prediction (Absolute)')
    fireEvent.click(screen.getByRole('button', { name: /^Both$/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load LOESS data')
    expect(screen.getByText('Model Prediction (Absolute)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry LOESS data' }))
    await waitFor(() => expect(service.loadLoessMultiSpanData).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('No LOESS data are available for this selection.')).toBeInTheDocument()
  })
})
