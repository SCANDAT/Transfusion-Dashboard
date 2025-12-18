import type { VitalParamCode, CompFactorCode } from './vitals'
import type { VisualizationData, TimeRange } from './data'

export type Theme = 'dark' | 'light'

export type TabId =
  | 'overview'
  | 'main-findings'
  | 'rbc-transfusions'
  | 'component-factor-effects'
  | 'descriptive-statistics'

export interface ChartDisplayOptions {
  showConfidenceInterval: boolean
  showBaseModel: boolean
  showDeltaPlot: boolean
}

export interface DashboardState {
  theme: Theme
  activeTab: TabId
  isLoading: boolean
  error: string | null

  selectedVital: VitalParamCode | null
  selectedCompFactor: CompFactorCode | null
  selectedComparisons: (string | number)[]
  timeRange: TimeRange
  displayOptions: ChartDisplayOptions
  visualizationData: VisualizationData | null

  transfusionSelectedVitals: VitalParamCode[]
  transfusionTimeRange: TimeRange
  transfusionDisplayOptions: ChartDisplayOptions

  availableVitals: VitalParamCode[]
  availableCompFactors: CompFactorCode[]
}

export interface DashboardActions {
  setTheme: (theme: Theme) => void
  toggleTheme: () => void

  setActiveTab: (tab: TabId) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

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

  toggleTransfusionVital: (vital: VitalParamCode) => void
  setTransfusionTimeRange: (range: TimeRange) => void
  setTransfusionDisplayOption: <K extends keyof ChartDisplayOptions>(
    key: K,
    value: ChartDisplayOptions[K]
  ) => void

  setAvailableVitals: (vitals: VitalParamCode[]) => void
  setAvailableCompFactors: (factors: CompFactorCode[]) => void

  resetComponentFactorState: () => void
  resetTransfusionState: () => void
}

export type DashboardStore = DashboardState & DashboardActions
