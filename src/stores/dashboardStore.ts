import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { useEffect } from 'react'
import type {
  DashboardStore,
  Theme,
  TabId,
  ChartDisplayOptions,
} from '@/types/store'
import type { VitalParamCode, CompFactorCode, VisualizationData, TimeRange } from '@/types'

const DEFAULT_DISPLAY_OPTIONS: ChartDisplayOptions = {
  showConfidenceInterval: true,
  showBaseModel: false,
  showDeltaPlot: true,
}

const DEFAULT_TIME_RANGE: TimeRange = [-720, 720]

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeTab: 'overview',
      isLoading: false,
      error: null,

      selectedVital: null,
      selectedCompFactor: null,
      selectedComparisons: [],
      timeRange: DEFAULT_TIME_RANGE,
      displayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
      visualizationData: null,

      transfusionSelectedVitals: [],
      transfusionTimeRange: DEFAULT_TIME_RANGE,
      transfusionDisplayOptions: { ...DEFAULT_DISPLAY_OPTIONS },

      availableVitals: [],
      availableCompFactors: [],

      setTheme: (theme: Theme) => set({ theme }),
      toggleTheme: () =>
        set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      setActiveTab: (activeTab: TabId) => set({ activeTab }),

      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      setSelectedVital: (vital: VitalParamCode | null) => {
        set({
          selectedVital: vital,
          selectedCompFactor: null,
          selectedComparisons: [],
          visualizationData: null,
        })
      },

      setSelectedCompFactor: (factor: CompFactorCode | null) => {
        set({
          selectedCompFactor: factor,
          selectedComparisons: [],
          visualizationData: null,
        })
      },

      toggleComparison: (value: string | number) =>
        set(state => {
          const current = state.selectedComparisons
          const exists = current.includes(value)
          return {
            selectedComparisons: exists
              ? current.filter(v => v !== value)
              : [...current, value],
          }
        }),

      selectAllComparisons: (values: (string | number)[]) =>
        set({ selectedComparisons: values }),

      setTimeRange: (timeRange: TimeRange) => set({ timeRange }),

      setDisplayOption: <K extends keyof ChartDisplayOptions>(
        key: K,
        value: ChartDisplayOptions[K]
      ) =>
        set(state => ({
          displayOptions: {
            ...state.displayOptions,
            [key]: value,
          },
        })),

      setVisualizationData: (data: VisualizationData | null) =>
        set({ visualizationData: data }),

      toggleTransfusionVital: (vital: VitalParamCode) =>
        set(state => {
          const current = state.transfusionSelectedVitals
          const exists = current.includes(vital)
          return {
            transfusionSelectedVitals: exists
              ? current.filter(v => v !== vital)
              : [...current, vital],
          }
        }),

      setTransfusionTimeRange: (transfusionTimeRange: TimeRange) =>
        set({ transfusionTimeRange }),

      setTransfusionDisplayOption: <K extends keyof ChartDisplayOptions>(
        key: K,
        value: ChartDisplayOptions[K]
      ) =>
        set(state => ({
          transfusionDisplayOptions: {
            ...state.transfusionDisplayOptions,
            [key]: value,
          },
        })),

      setAvailableVitals: (availableVitals: VitalParamCode[]) =>
        set({ availableVitals }),

      setAvailableCompFactors: (availableCompFactors: CompFactorCode[]) =>
        set({ availableCompFactors }),

      resetComponentFactorState: () =>
        set({
          selectedVital: null,
          selectedCompFactor: null,
          selectedComparisons: [],
          timeRange: DEFAULT_TIME_RANGE,
          displayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
          visualizationData: null,
        }),

      resetTransfusionState: () =>
        set({
          transfusionSelectedVitals: [],
          transfusionTimeRange: DEFAULT_TIME_RANGE,
          transfusionDisplayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
        }),
    }),
    {
      name: 'scandat-dashboard-storage',
      partialize: state => ({
        theme: state.theme,
        activeTab: state.activeTab,
      }),
    }
  )
)

export const selectComponentFactorState = (state: DashboardStore) => ({
  selectedVital: state.selectedVital,
  selectedCompFactor: state.selectedCompFactor,
  selectedComparisons: state.selectedComparisons,
  timeRange: state.timeRange,
  displayOptions: state.displayOptions,
  visualizationData: state.visualizationData,
})

export const selectTransfusionState = (state: DashboardStore) => ({
  selectedVitals: state.transfusionSelectedVitals,
  timeRange: state.transfusionTimeRange,
  displayOptions: state.transfusionDisplayOptions,
})

export const selectUIState = (state: DashboardStore) => ({
  theme: state.theme,
  activeTab: state.activeTab,
  isLoading: state.isLoading,
  error: state.error,
})

export const selectTheme = (state: DashboardStore) => state.theme

export const selectActiveTab = (state: DashboardStore) => state.activeTab

export function useThemeSync() {
  const theme = useDashboardStore(selectTheme)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      document.body.classList.toggle('light-theme', theme === 'light')
    }
  }, [theme])

  return theme
}

export function useComponentFactorEffectsState() {
  return useDashboardStore(
    useShallow((state) => ({
      selectedVital: state.selectedVital,
      selectedCompFactor: state.selectedCompFactor,
      selectedComparisons: state.selectedComparisons,
      timeRange: state.timeRange,
      displayOptions: state.displayOptions,
      visualizationData: state.visualizationData,
      availableVitals: state.availableVitals,
      availableCompFactors: state.availableCompFactors,
    }))
  )
}

export function useComponentFactorEffectsActions() {
  return useDashboardStore(
    useShallow((state) => ({
      setSelectedVital: state.setSelectedVital,
      setSelectedCompFactor: state.setSelectedCompFactor,
      toggleComparison: state.toggleComparison,
      selectAllComparisons: state.selectAllComparisons,
      setTimeRange: state.setTimeRange,
      setDisplayOption: state.setDisplayOption,
      setVisualizationData: state.setVisualizationData,
      setAvailableVitals: state.setAvailableVitals,
      setAvailableCompFactors: state.setAvailableCompFactors,
      setError: state.setError,
    }))
  )
}

export function useTransfusionState() {
  return useDashboardStore(
    useShallow((state) => ({
      transfusionSelectedVitals: state.transfusionSelectedVitals,
      transfusionTimeRange: state.transfusionTimeRange,
      transfusionDisplayOptions: state.transfusionDisplayOptions,
      availableVitals: state.availableVitals,
    }))
  )
}

export function useTransfusionActions() {
  return useDashboardStore(
    useShallow((state) => ({
      toggleTransfusionVital: state.toggleTransfusionVital,
      setTransfusionTimeRange: state.setTransfusionTimeRange,
      setTransfusionDisplayOption: state.setTransfusionDisplayOption,
      setAvailableVitals: state.setAvailableVitals,
      setError: state.setError,
    }))
  )
}

export function useNavigation() {
  const activeTab = useDashboardStore(selectActiveTab)
  const setActiveTab = useDashboardStore((state) => state.setActiveTab)
  return { activeTab, setActiveTab }
}

export function useMainFindingsNavigation() {
  return useDashboardStore(
    useShallow((state) => ({
      setSelectedVital: state.setSelectedVital,
      setSelectedCompFactor: state.setSelectedCompFactor,
      setActiveTab: state.setActiveTab,
    }))
  )
}

export function useErrorState() {
  return useDashboardStore(
    useShallow((state) => ({
      error: state.error,
      setError: state.setError,
      clearError: state.clearError,
    }))
  )
}
