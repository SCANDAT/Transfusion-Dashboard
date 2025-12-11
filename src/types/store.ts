import type { VitalParamCode, CompFactorCode } from './vitals'
import type { VisualizationData, TimeRange } from './data'

/**
 * Theme type
 */
export type Theme = 'dark' | 'light'

/**
 * Tab identifiers
 */
export type TabId =
  | 'overview'
  | 'main-findings'
  | 'rbc-transfusions'
  | 'component-factor-effects'
  | 'descriptive-statistics'

/**
 * Chart display options
 */
export interface ChartDisplayOptions {
  showConfidenceInterval: boolean
  showBaseModel: boolean
  showDeltaPlot: boolean
}

/**
 * Dashboard Store State
 */
export interface DashboardState {
  // UI State
  theme: Theme
  activeTab: TabId
  isLoading: boolean
  error: string | null

  // Component Factor Effects Tab State
  selectedVital: VitalParamCode | null
  selectedCompFactor: CompFactorCode | null
  selectedComparisons: (string | number)[]
  timeRange: TimeRange
  displayOptions: ChartDisplayOptions
  visualizationData: VisualizationData | null

  // RBC Transfusions Tab State
  transfusionSelectedVitals: VitalParamCode[]
  transfusionTimeRange: TimeRange
  transfusionDisplayOptions: ChartDisplayOptions

  // Available options (from data)
  availableVitals: VitalParamCode[]
  availableCompFactors: CompFactorCode[]
}

/**
 * Dashboard Store Actions
 */
export interface DashboardActions {
  // Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void

  // Navigation
  setActiveTab: (tab: TabId) => void

  // Loading & Error
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Component Factor Effects Tab
  setSelectedVital: (vital: VitalParamCode | null) => void
  setSelectedCompFactor: (factor: CompFactorCode | null) => void
  toggleComparison: (value: string | number) => void
  selectAllComparisons: (values: (string | number)[]) => void
  setTimeRange: (range: TimeRange) => void
  setDisplayOption: <K extends keyof ChartDisplayOptions>(
    key: K,
    value: ChartDisplayOptions[K]
  ) => void
  setVisualizationData: (data: VisualizationData | null) => void

  // RBC Transfusions Tab
  toggleTransfusionVital: (vital: VitalParamCode) => void
  setTransfusionTimeRange: (range: TimeRange) => void
  setTransfusionDisplayOption: <K extends keyof ChartDisplayOptions>(
    key: K,
    value: ChartDisplayOptions[K]
  ) => void

  // Available options setters
  setAvailableVitals: (vitals: VitalParamCode[]) => void
  setAvailableCompFactors: (factors: CompFactorCode[]) => void

  // Reset
  resetComponentFactorState: () => void
  resetTransfusionState: () => void
}

/**
 * Complete Store Type
 */
export type DashboardStore = DashboardState & DashboardActions
