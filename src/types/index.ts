// Re-export all types from submodules
// Note: Types are consolidated to avoid duplicate export conflicts

// Vitals (includes both vital params and comp factor definitions)
export * from './vitals'

// Data types (visualization data, transfusion data, etc.)
// Using explicit re-exports to avoid duplicates with statistics.ts
export type {
  VizIndexEntry,
  VisualizationDataRow,
  VisualizationData,
  VisualizationMetadata,
  TransfusionDataRow,
  LoessDataRow,
  LoessMultiSpanRow,
  ObservedSummaryRow,
  ModelSummaryRow,
  ForestPlotPoint,
  TimeRange,
  FactorObservedSummaryRow,
  FactorModelSummaryRow,
  VitalSummaryRow,
  ModelVitalSummaryRow,
} from './data'

// Statistics types (descriptive statistics only)
export type {
  DescriptiveStatistics,
  PatientSexDistribution,
  PatientAgeStats,
  AgeGroupDistribution,
  RbcUnitsPerPatient,
  DonorHbDistribution,
  StorageDistribution,
  DonorSexDistribution,
  DonorParityDistribution,
  DonationWeekdayDistribution,
} from './statistics'

// Chart types (excludes ChartDisplayOptions to avoid duplicate with store.ts)
export type {
  BaseChartProps,
  ChartTheme,
  ChartExportOptions,
  SmallMultipleConfig,
  ForestPlotConfig,
  TimeSeriesConfig,
} from './charts'
export { CHART_COLORS, getChartColor } from './charts'

// Store types (ChartDisplayOptions is the canonical export from here)
export * from './store'
