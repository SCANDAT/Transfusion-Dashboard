import type { VitalParamCode, CompFactorCode } from './vitals'

export interface VizIndexEntry {
  VitalParam: VitalParamCode
  CompFactor: CompFactorCode
  CompName?: string
  VitalName?: string
  YLabel?: string
  DeltaYLabel?: string
}

export interface VisualizationDataRow {
  TimeFromTransfusion: number
  VitalParam: VitalParamCode
  CompFactor: CompFactorCode
  CompValue: string | number

  PredVal_Full: number
  Lower_Full: number
  Upper_Full: number

  PredVal_Base?: number
  Lower_Base?: number
  Upper_Base?: number

  Delta_Full: number
  Delta_Lower?: number
  Delta_Upper?: number
  Delta_Base?: number
}

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

export interface TransfusionDataRow {
  TimeFromTransfusion: number
  VitalParam: VitalParamCode

  PredVal_Full: number
  PredVal_Base?: number

  Lower_Full: number
  Upper_Full: number

  Delta_Full: number
  Delta_Base?: number
  Delta_Lower?: number
  Delta_Upper?: number
}

export interface LoessDataRow {
  TimeFromTransfusion: number
  VitalParam: VitalParamCode
  Abbreviation?: string
  Pred: number
  LCL?: number
  UCL?: number
}

export interface LoessMultiSpanRow extends LoessDataRow {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

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

export interface ForestPlotPoint {
  label: string
  estimate: number
  lower: number
  upper: number
  n?: number
  pValue?: number
}

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

export type TimeRange = [number, number]
