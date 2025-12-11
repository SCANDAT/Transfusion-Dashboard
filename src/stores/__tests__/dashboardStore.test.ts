import { describe, it, expect, beforeEach } from 'vitest'
import { useDashboardStore } from '../dashboardStore'
import { act } from '@testing-library/react'

describe('dashboardStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useDashboardStore.setState({
      theme: 'dark',
      activeTab: 'main-findings',
      isLoading: false,
      error: null,
      selectedVital: null,
      selectedCompFactor: null,
      selectedComparisons: [],
      timeRange: [0, 720],
      displayOptions: {
        showConfidenceInterval: true,
        showBaseModel: false,
        showDeltaPlot: true,
      },
      transfusionSelectedVitals: [],
      transfusionTimeRange: [0, 720],
      transfusionDisplayOptions: {
        showConfidenceInterval: true,
        showBaseModel: false,
        showDeltaPlot: true,
      },
      availableVitals: [],
      availableCompFactors: [],
      visualizationData: null,
    })
  })

  describe('theme', () => {
    it('toggles theme', () => {
      const { toggleTheme } = useDashboardStore.getState()

      expect(useDashboardStore.getState().theme).toBe('dark')

      act(() => toggleTheme())
      expect(useDashboardStore.getState().theme).toBe('light')

      act(() => toggleTheme())
      expect(useDashboardStore.getState().theme).toBe('dark')
    })

    it('sets theme directly', () => {
      const { setTheme } = useDashboardStore.getState()

      act(() => setTheme('light'))
      expect(useDashboardStore.getState().theme).toBe('light')
    })
  })

  describe('tab navigation', () => {
    it('changes active tab', () => {
      const { setActiveTab } = useDashboardStore.getState()

      act(() => setActiveTab('rbc-transfusions'))
      expect(useDashboardStore.getState().activeTab).toBe('rbc-transfusions')
    })
  })

  describe('cascading resets', () => {
    it('resets compFactor and comparisons when vital changes', () => {
      const store = useDashboardStore.getState()

      // Set initial state
      act(() => {
        store.setSelectedVital('ARTm')
        store.setSelectedCompFactor('DonorHb_Cat')
        store.selectAllComparisons(['Low', 'Medium', 'High'])
      })

      // Verify state was set
      expect(useDashboardStore.getState().selectedCompFactor).toBe('DonorHb_Cat')
      expect(useDashboardStore.getState().selectedComparisons).toHaveLength(3)

      // Change vital - should cascade reset
      act(() => {
        useDashboardStore.getState().setSelectedVital('HR')
      })

      expect(useDashboardStore.getState().selectedVital).toBe('HR')
      expect(useDashboardStore.getState().selectedCompFactor).toBeNull()
      expect(useDashboardStore.getState().selectedComparisons).toEqual([])
    })

    it('resets comparisons when compFactor changes', () => {
      const store = useDashboardStore.getState()

      act(() => {
        store.setSelectedVital('ARTm')
        store.setSelectedCompFactor('DonorHb_Cat')
        store.selectAllComparisons(['Low', 'Medium', 'High'])
      })

      expect(useDashboardStore.getState().selectedComparisons).toHaveLength(3)

      act(() => {
        useDashboardStore.getState().setSelectedCompFactor('Storage_Cat')
      })

      expect(useDashboardStore.getState().selectedCompFactor).toBe('Storage_Cat')
      expect(useDashboardStore.getState().selectedComparisons).toEqual([])
    })
  })

  describe('comparison selection', () => {
    it('toggles individual comparisons', () => {
      const { toggleComparison } = useDashboardStore.getState()

      act(() => toggleComparison('Low'))
      expect(useDashboardStore.getState().selectedComparisons).toContain('Low')

      act(() => toggleComparison('Low'))
      expect(useDashboardStore.getState().selectedComparisons).not.toContain('Low')
    })

    it('selects all comparisons', () => {
      const { selectAllComparisons } = useDashboardStore.getState()

      act(() => selectAllComparisons(['A', 'B', 'C']))
      expect(useDashboardStore.getState().selectedComparisons).toEqual(['A', 'B', 'C'])
    })

    it('deselects all when passed empty array', () => {
      const { selectAllComparisons } = useDashboardStore.getState()

      act(() => selectAllComparisons(['A', 'B']))
      act(() => selectAllComparisons([]))

      expect(useDashboardStore.getState().selectedComparisons).toEqual([])
    })
  })

  describe('time range', () => {
    it('sets time range', () => {
      const { setTimeRange } = useDashboardStore.getState()

      act(() => setTimeRange([60, 360]))
      expect(useDashboardStore.getState().timeRange).toEqual([60, 360])
    })
  })

  describe('display options', () => {
    it('toggles individual options', () => {
      const { setDisplayOption } = useDashboardStore.getState()

      act(() => setDisplayOption('showBaseModel', true))
      expect(useDashboardStore.getState().displayOptions.showBaseModel).toBe(true)

      act(() => setDisplayOption('showConfidenceInterval', false))
      expect(useDashboardStore.getState().displayOptions.showConfidenceInterval).toBe(false)
    })
  })

  describe('transfusion tab', () => {
    it('toggles vital parameters', () => {
      const { toggleTransfusionVital } = useDashboardStore.getState()

      act(() => toggleTransfusionVital('ARTm'))
      expect(useDashboardStore.getState().transfusionSelectedVitals).toContain('ARTm')

      act(() => toggleTransfusionVital('HR'))
      expect(useDashboardStore.getState().transfusionSelectedVitals).toEqual(['ARTm', 'HR'])

      act(() => toggleTransfusionVital('ARTm'))
      expect(useDashboardStore.getState().transfusionSelectedVitals).toEqual(['HR'])
    })
  })

  describe('loading and error states', () => {
    it('sets loading state', () => {
      const { setLoading } = useDashboardStore.getState()

      act(() => setLoading(true))
      expect(useDashboardStore.getState().isLoading).toBe(true)

      act(() => setLoading(false))
      expect(useDashboardStore.getState().isLoading).toBe(false)
    })

    it('sets and clears error', () => {
      const { setError, clearError } = useDashboardStore.getState()

      act(() => setError('Something went wrong'))
      expect(useDashboardStore.getState().error).toBe('Something went wrong')

      act(() => clearError())
      expect(useDashboardStore.getState().error).toBeNull()
    })
  })
})
