import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MainFindingsTab } from '../index'

const loaders = vi.hoisted(() => ({
  loadVizIndex: vi.fn(),
  loadVitalSummary: vi.fn(),
  loadModelVitalSummary: vi.fn(),
  loadFactorObservedSummary: vi.fn(),
  loadFactorModelSummary: vi.fn(),
}))

vi.mock('@/services/dataService', () => loaders)
vi.mock('@/components/charts', () => ({ BaseChart: () => <div /> }))
vi.mock('../VirtualizedGrid', () => ({ VirtualizedGrid: () => <div /> }))
vi.mock('../SummaryTableA', () => ({ SummaryTableA: () => <div /> }))
vi.mock('../SummaryTableB', () => ({
  SummaryTableB: () => <div />,
  SingleFactorTable: () => <div />,
  useGroupedFactorData: () => [],
}))
vi.mock('../FactorForestPlot', () => ({
  FactorForestPlot: () => <div />,
  AllFactorForestPlots: () => <div />,
}))

beforeEach(() => {
  for (const loader of Object.values(loaders)) loader.mockReset().mockResolvedValue([])
})
afterEach(cleanup)

describe('Main Findings required results', () => {
  it.each(Object.keys(loaders) as (keyof typeof loaders)[])(
    'shows a retryable failure when %s cannot load',
    async name => {
      loaders[name].mockRejectedValueOnce(new Error('Synthetic request failure'))
      render(<MainFindingsTab />)
      expect((await screen.findByRole('alert')).textContent).toContain('could not be loaded completely')
      expect(screen.queryByRole('heading', { name: 'Key Results' })).toBeNull()
      expect(screen.getByRole('button', { name: 'Retry loading results' })).toBeDefined()
    }
  )

  it('recovers after retry without requiring a page refresh', async () => {
    loaders.loadFactorModelSummary.mockRejectedValueOnce(new Error('Temporary failure'))
    render(<MainFindingsTab />)
    fireEvent.click(await screen.findByRole('button', { name: 'Retry loading results' }))
    expect(await screen.findByRole('heading', { name: 'Key Results' })).toBeDefined()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(loaders.loadFactorModelSummary).toHaveBeenCalledTimes(2)
  })

  it('waits for the final required summary before presenting findings', async () => {
    let finish: (rows: unknown[]) => void = () => undefined
    loaders.loadModelVitalSummary.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    render(<MainFindingsTab />)
    expect(screen.getByRole('status').textContent).toContain('Loading main findings')
    expect(screen.queryByRole('heading', { name: 'Key Results' })).toBeNull()
    await act(async () => { finish([]) })
    expect(await screen.findByRole('heading', { name: 'Key Results' })).toBeDefined()
  })
})
