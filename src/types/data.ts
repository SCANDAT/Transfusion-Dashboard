import type { VitalParamCode, CompFactorCode } from './vitals'

/**
 * Visualization Index Entry
 * Maps vital parameters and component factors to their data files
 */
export interface VizIndexEntry {
  VitalParam: VitalParamCode
  CompFactor: CompFactorCode
  CompName?: string
  VitalName?: string
  YLabel?: string
  DeltaYLabel?: string
}

/**
 * Visualization Data Row
 * Core data structure for time-series visualization
 */
export interface VisualizationDataRow {
  TimeFromTransfusion: number
  VitalParam: VitalParamCode
  CompFactor: CompFactorCode
  CompValue: string | number  // The actual category/value for comparison

  // Full model predictions (with confounders adjusted)
  PredVal_Full: number
  Lower_Full: number
  Upper_Full: number

  // Base model predictions (without confounder adjustment)
  PredVal_Base?: number
  Lower_Base?: number
  Upper_Base?: number

  // Delta (change from baseline) values
  Delta_Full: number
  Delta_Lower?: number
  Delta_Upper?: number
  Delta_Base?: number
}

/**
 * Structured Visualization Data with Metadata
 */
export interface VisualizationData {
  rows: VisualizationDataRow[]
  metadata: VisualizationMetadata
  comparisonColumn: CompFactorCode
  comparisonValues: (string | number)[]
}

export interface VisualizationMetadata {
  vitalParam: VitalParamCode
  vitalName: string
  compFactor: CompFactorCode
  compName: string
  yLabel: string
  deltaYLabel: string
  timeRange: [number, number]
  dataPoints: number
}

/**
 * Transfusion Effect Data Row
 * For the RBC Transfusions tab showing overall transfusion effects
 */
export interface TransfusionDataRow {
  TimeFromTransfusion: number
  VitalParam: VitalParamCode

  // Predicted values
  PredVal_Full: number
  PredVal_Base?: number

  // Confidence intervals
  Lower_Full: number
  Upper_Full: number

  // Delta values
  Delta_Full: number
  Delta_Base?: number
  Delta_Lower?: number
  Delta_Upper?: number
}

/**
 * LOESS Smoothing Data Row
 */
export interface LoessDataRow {
  TimeFromTransfusion: number
  VitalParam: VitalParamCode
  Abbreviation?: string  // Alternative vital param identifier in some CSV files
  Pred: number
  LCL?: number
  UCL?: number
}

/**
 * LOESS Data Row with multiple span values (10-90)
 * Each span value represents LOESS smoothing parameter from 0.10 to 0.90
 */
export interface LoessMultiSpanRow extends LoessDataRow {
  // Span-specific predictions (10-90 representing 0.10-0.90)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/**
 * Observed Data Summary Row
 * For descriptive statistics
 */
export interface ObservedSummaryRow {
  VitalParam: VitalParamCode
  CompFactor: CompFactorCode
  CompValue: string
  N: number
  PreMean: number
  PreSD: number
  PostMean: number
  PostSD: number
  DiffMean: number
  DiffSD: number
}

/**
 * Model-Based Summary Row
 */
export interface ModelSummaryRow {
  VitalParam: VitalParamCode
  CompFactor: CompFactorCode
  CompValue: string
  Estimate_Full: number
  SE_Full: number
  Lower_Full: number
  Upper_Full: number
  Estimate_Base?: number
  SE_Base?: number
  Lower_Base?: number
  Upper_Base?: number
}

/**
 * Forest Plot Data Point
 */
export interface ForestPlotPoint {
  label: string
  estimate: number
  lower: number
  upper: number
  n?: number
  pValue?: number
}

/**
 * Factor Observed Data Summary Row (Table 2a style)
 * From factor_observed_data_summary.csv
 */
export interface FactorObservedSummaryRow {
  Abbreviation: VitalParamCode
  FactorName: CompFactorCode
  FactorCategory: string
  Pre_Mean: number
  Pre_SD: number
  Post_Mean: number
  Post_SD: number
  Diff_Mean: number
  Diff_SE: number
  NDiff: number
  Diff_LCL: number
  Diff_UCL: number
  Diff_T?: number
  df?: number
  p_value?: number
}

/**
 * Factor Model Based Summary Row (Table 2b style)
 * From factor_model_based_summary.csv
 */
export interface FactorModelSummaryRow {
  Abbreviation: VitalParamCode
  FactorName: CompFactorCode
  FactorCategory: string
  Base_Pre: number
  Base_Pre_SE: number
  Full_Pre: number
  Full_Pre_SE: number
  Base_Post: number
  Base_Post_SE: number
  Full_Post: number
  Full_Post_SE: number
  Base_Diff: number
  Base_Diff_SE: number
  Base_Diff_LCL: number
  Base_Diff_UCL: number
  Full_Diff: number
  Full_Diff_SE: number
  Full_Diff_LCL: number
  Full_Diff_UCL: number
}

/**
 * Vital Parameter Summary for Main Findings
 * From observed_data_summary.csv
 */
export interface VitalSummaryRow {
  Abbreviation: VitalParamCode
  Pre_Mean: number
  Pre_SD: number
  Post_Mean: number
  Post_SD: number
  Diff_Mean: number
  Diff_LCL: number
  Diff_UCL: number
}

/**
 * Model Based Vital Summary for Main Findings
 * From model_based_summary.csv
 */
export interface ModelVitalSummaryRow {
  Abbreviation: VitalParamCode
  Base_Pre: number
  Base_Post: number
  Base_Diff: number
  Base_Diff_SE: number
  Base_Diff_LCL: number
  Base_Diff_UCL: number
  Full_Pre: number
  Full_Post: number
  Full_Diff: number
  Full_Diff_SE: number
  Full_Diff_LCL: number
  Full_Diff_UCL: number
}

/**
 * Descriptive Statistics Types
 */
export interface PatientSexDistribution {
  sex: string
  count: number
  percentage: number
}

export interface PatientAgeStats {
  mean: number
  sd: number
  median: number
  q1: number
  q3: number
  min: number
  max: number
}

export interface AgeGroupDistribution {
  ageGroup: string
  count: number
  percentage: number
}

export interface RbcUnitsPerPatient {
  unitsReceived: number
  count: number
  percentage: number
}

export interface DonorHbDistribution {
  category: string
  count: number
  percentage: number
}

export interface DonorSexDistribution {
  sex: string
  count: number
  percentage: number
}

export interface DonorParityDistribution {
  parity: string
  count: number
  percentage: number
}

export interface DonationWeekdayDistribution {
  weekday: string
  count: number
  percentage: number
}

export interface StorageDistribution {
  category: string
  count: number
  percentage: number
}

/**
 * Complete Descriptive Statistics Data
 */
export interface DescriptiveStatistics {
  uniquePatients: number
  totalUnits: number
  patientSex: PatientSexDistribution[]
  patientAge: PatientAgeStats
  ageGroups: AgeGroupDistribution[]
  rbcUnitsPerPatient: RbcUnitsPerPatient[]
  donorHb: DonorHbDistribution[]
  donorSex: DonorSexDistribution[]
  donorParity: DonorParityDistribution[]
  donationWeekday: DonationWeekdayDistribution[]
  storage: StorageDistribution[]
}

/**
 * Time Range tuple type
 */
export type TimeRange = [number, number]
