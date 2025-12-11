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
      // ═══════════════════════════════════════════════════════════════
      // STATE
      // ═══════════════════════════════════════════════════════════════

      // UI State
      theme: 'dark',
      activeTab: 'overview',
      isLoading: false,
      error: null,

      // Component Factor Effects Tab State
      selectedVital: null,
      selectedCompFactor: null,
      selectedComparisons: [],
      timeRange: DEFAULT_TIME_RANGE,
      displayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
      visualizationData: null,

      // RBC Transfusions Tab State
      transfusionSelectedVitals: [],
      transfusionTimeRange: DEFAULT_TIME_RANGE,
      transfusionDisplayOptions: { ...DEFAULT_DISPLAY_OPTIONS },

      // Available options
      availableVitals: [],
      availableCompFactors: [],

      // ═══════════════════════════════════════════════════════════════
      // ACTIONS
      // ═══════════════════════════════════════════════════════════════

      // Theme
      setTheme: (theme: Theme) => set({ theme }),
      toggleTheme: () =>
        set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      // Navigation
      setActiveTab: (activeTab: TabId) => set({ activeTab }),

      // Loading & Error
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Component Factor Effects Tab - Cascading Selection
      setSelectedVital: (vital: VitalParamCode | null) => {
        // Cascade reset: changing vital resets factor and comparisons
        set({
          selectedVital: vital,
          selectedCompFactor: null,
          selectedComparisons: [],
          visualizationData: null,
        })
      },

      setSelectedCompFactor: (factor: CompFactorCode | null) => {
        // Cascade reset: changing factor resets comparisons
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

      // RBC Transfusions Tab
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

      // Available options setters
      setAvailableVitals: (availableVitals: VitalParamCode[]) =>
        set({ availableVitals }),

      setAvailableCompFactors: (availableCompFactors: CompFactorCode[]) =>
        set({ availableCompFactors }),

      // Reset functions
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
      // Only persist theme and activeTab
      partialize: state => ({
        theme: state.theme,
        activeTab: state.activeTab,
      }),
    }
  )
)

// ═══════════════════════════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════════════════════════

/**
 * Select component factor effects tab state
 */
export const selectComponentFactorState = (state: DashboardStore) => ({
  selectedVital: state.selectedVital,
  selectedCompFactor: state.selectedCompFactor,
  selectedComparisons: state.selectedComparisons,
  timeRange: state.timeRange,
  displayOptions: state.displayOptions,
  visualizationData: state.visualizationData,
})

/**
 * Select transfusion tab state
 */
export const selectTransfusionState = (state: DashboardStore) => ({
  selectedVitals: state.transfusionSelectedVitals,
  timeRange: state.transfusionTimeRange,
  displayOptions: state.transfusionDisplayOptions,
})

/**
 * Select UI state
 */
export const selectUIState = (state: DashboardStore) => ({
  theme: state.theme,
  activeTab: state.activeTab,
  isLoading: state.isLoading,
  error: state.error,
})

/**
 * Select theme
 */
export const selectTheme = (state: DashboardStore) => state.theme

/**
 * Select active tab
 */
export const selectActiveTab = (state: DashboardStore) => state.activeTab

/**
 * Hook to sync theme to DOM and return current theme
 * Should be called in App component to keep DOM in sync
 */
export function useThemeSync() {
  const theme = useDashboardStore(selectTheme)

  // Sync on mount and theme change - MUST be in useEffect to avoid render-phase side effects
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      document.body.classList.toggle('light-theme', theme === 'light')
    }
  }, [theme])

  return theme
}

// ═══════════════════════════════════════════════════════════════
// OPTIMIZED SELECTOR HOOKS (use useShallow for object selections)
// ═══════════════════════════════════════════════════════════════

/**
 * Hook for Component Factor Effects tab - only re-renders when relevant state changes
 */
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

/**
 * Hook for Component Factor Effects tab actions
 */
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

/**
 * Hook for RBC Transfusions tab - only re-renders when relevant state changes
 */
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

/**
 * Hook for RBC Transfusions tab actions
 */
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

/**
 * Hook for navigation - only re-renders when activeTab changes
 */
export function useNavigation() {
  const activeTab = useDashboardStore(selectActiveTab)
  const setActiveTab = useDashboardStore((state) => state.setActiveTab)
  return { activeTab, setActiveTab }
}

/**
 * Hook for MainFindings tab navigation actions
 */
export function useMainFindingsNavigation() {
  return useDashboardStore(
    useShallow((state) => ({
      setSelectedVital: state.setSelectedVital,
      setSelectedCompFactor: state.setSelectedCompFactor,
      setActiveTab: state.setActiveTab,
    }))
  )
}

/**
 * Hook for error state
 */
export function useErrorState() {
  return useDashboardStore(
    useShallow((state) => ({
      error: state.error,
      setError: state.setError,
      clearError: state.clearError,
    }))
  )
}
