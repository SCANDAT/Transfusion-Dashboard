# T-003: TypeScript Type Definitions

| Field | Value |
|-------|-------|
| **ID** | T-003 |
| **Title** | TypeScript Type Definitions |
| **Phase** | 2 - Data Layer |
| **Priority** | Critical |
| **Depends On** | T-001 |
| **Blocks** | T-004, T-005 |
| **Estimated Effort** | 2-3 hours |

---

## Objective

Create comprehensive TypeScript type definitions for all data structures, API responses, and application state. These types enforce correctness across the entire application.

---

## Context

The legacy application processes 60+ CSV files containing:
- Visualization data (vital parameters × component factors)
- Transfusion effect data
- LOESS analysis data
- Summary statistics
- Descriptive statistics

All data follows consistent schemas documented in `architecture.md`. This ticket creates type-safe representations of these structures.

---

## Requirements

### 1. Vital Parameter Types

**`src/types/vitals.ts`:**

```typescript
/**
 * Vital parameter codes as used in data files
 */
export const VITAL_PARAM_CODES = [
  'ARTm',  // Mean Arterial Pressure
  'ARTs',  // Systolic Blood Pressure
  'ARTd',  // Diastolic Blood Pressure
  'HR',    // Heart Rate
  'FIO2',  // Fraction of Inspired Oxygen
  'SPO2',  // Peripheral Capillary O2 Saturation
  'VE',    // Minute Ventilation
] as const

export type VitalParamCode = typeof VITAL_PARAM_CODES[number]

/**
 * Human-readable vital parameter information
 */
export interface VitalParamInfo {
  code: VitalParamCode
  name: string
  displayName: string  // Short name for buttons
  unit: string
  yAxisLabel: string
  deltaYAxisLabel: string
}

export const VITAL_PARAMS: Record<VitalParamCode, VitalParamInfo> = {
  ARTm: {
    code: 'ARTm',
    name: 'Mean Arterial Pressure',
    displayName: 'MAP',
    unit: 'mmHg',
    yAxisLabel: 'MAP (mmHg)',
    deltaYAxisLabel: 'Δ MAP (mmHg)',
  },
  ARTs: {
    code: 'ARTs',
    name: 'Systolic Blood Pressure',
    displayName: 'SBP',
    unit: 'mmHg',
    yAxisLabel: 'SBP (mmHg)',
    deltaYAxisLabel: 'Δ SBP (mmHg)',
  },
  ARTd: {
    code: 'ARTd',
    name: 'Diastolic Blood Pressure',
    displayName: 'DBP',
    unit: 'mmHg',
    yAxisLabel: 'DBP (mmHg)',
    deltaYAxisLabel: 'Δ DBP (mmHg)',
  },
  HR: {
    code: 'HR',
    name: 'Heart Rate',
    displayName: 'HR',
    unit: 'bpm',
    yAxisLabel: 'Heart Rate (bpm)',
    deltaYAxisLabel: 'Δ Heart Rate (bpm)',
  },
  FIO2: {
    code: 'FIO2',
    name: 'Fraction of Inspired Oxygen',
    displayName: 'FiO2',
    unit: '%',
    yAxisLabel: 'FiO2 (%)',
    deltaYAxisLabel: 'Δ FiO2 (%)',
  },
  SPO2: {
    code: 'SPO2',
    name: 'Peripheral Capillary O2 Saturation',
    displayName: 'SpO2',
    unit: '%',
    yAxisLabel: 'SpO2 (%)',
    deltaYAxisLabel: 'Δ SpO2 (%)',
  },
  VE: {
    code: 'VE',
    name: 'Minute Ventilation',
    displayName: 'VE',
    unit: 'L/min',
    yAxisLabel: 'VE (L/min)',
    deltaYAxisLabel: 'Δ VE (L/min)',
  },
}

/**
 * Type guard for vital param codes
 */
export function isVitalParamCode(value: string): value is VitalParamCode {
  return VITAL_PARAM_CODES.includes(value as VitalParamCode)
}
```

### 2. Component Factor Types

**`src/types/factors.ts`:**

```typescript
/**
 * RBC Component factor codes as used in data files
 */
export const COMP_FACTOR_CODES = [
  'DonorHb_Cat',   // Donor Hemoglobin Category
  'Storage_Cat',   // RBC Storage Time Category
  'DonorSex',      // Donor Sex
  'DonorParity',   // Donor Parity (for female donors)
  'wdy_donation',  // Weekday of Donation
] as const

export type CompFactorCode = typeof COMP_FACTOR_CODES[number]

/**
 * Human-readable component factor information
 */
export interface CompFactorInfo {
  code: CompFactorCode
  name: string
  displayName: string
  categories: ComparisonCategory[]
}

export interface ComparisonCategory {
  value: string | number
  label: string
  color?: string
}

export const COMP_FACTORS: Record<CompFactorCode, CompFactorInfo> = {
  DonorHb_Cat: {
    code: 'DonorHb_Cat',
    name: 'Donor Hemoglobin',
    displayName: 'Donor Hb',
    categories: [
      { value: 1, label: '<125 g/L' },
      { value: 2, label: '125-139 g/L' },
      { value: 3, label: '140-154 g/L' },
      { value: 4, label: '155-169 g/L' },
      { value: 5, label: '≥170 g/L' },
    ],
  },
  Storage_Cat: {
    code: 'Storage_Cat',
    name: 'RBC Storage Time',
    displayName: 'Storage',
    categories: [
      { value: 1, label: '<10 days' },
      { value: 2, label: '10-19 days' },
      { value: 3, label: '20-29 days' },
      { value: 4, label: '30-39 days' },
      { value: 5, label: '≥40 days' },
    ],
  },
  DonorSex: {
    code: 'DonorSex',
    name: 'Donor Sex',
    displayName: 'Donor Sex',
    categories: [
      { value: 'Male', label: 'Male' },
      { value: 'Female', label: 'Female' },
    ],
  },
  DonorParity: {
    code: 'DonorParity',
    name: 'Donor Parity',
    displayName: 'Parity',
    categories: [
      { value: 'Nulliparous', label: 'Nulliparous' },
      { value: 'Parous', label: 'Parous' },
    ],
  },
  wdy_donation: {
    code: 'wdy_donation',
    name: 'Weekday of Donation',
    displayName: 'Weekday',
    categories: [
      { value: 1, label: 'Sunday' },
      { value: 2, label: 'Monday' },
      { value: 3, label: 'Tuesday' },
      { value: 4, label: 'Wednesday' },
      { value: 5, label: 'Thursday' },
      { value: 6, label: 'Friday' },
      { value: 7, label: 'Saturday' },
    ],
  },
}

/**
 * Type guard for component factor codes
 */
export function isCompFactorCode(value: string): value is CompFactorCode {
  return COMP_FACTOR_CODES.includes(value as CompFactorCode)
}
```

### 3. Data Row Types

**`src/types/data.ts`:**

```typescript
import type { VitalParamCode } from './vitals'
import type { CompFactorCode } from './factors'

/**
 * Raw visualization data row from VIZ_{VITAL}_{FACTOR}.csv
 */
export interface VisualizationDataRow {
  TimeFromTransfusion: number
  PredVal_Base: number
  StdErrVal_Base: number
  PredVal_Full: number
  StdErrVal_Full: number
  Lower_Full: number
  Upper_Full: number
  Delta_Base: number
  Delta_Full: number
  Delta_Lower: number
  Delta_Upper: number
  VitalParam: VitalParamCode
  CompFactor: CompFactorCode
  CompName: string
  VitalName: string
  YLabel: string
  DeltaYLabel: string
  // Dynamic comparison column - one of these will be present
  DonorHb_Cat?: number
  Storage_Cat?: number
  DonorSex?: string
  DonorParity?: string
  wdy_donation?: number
}

/**
 * Parsed visualization data with metadata
 */
export interface VisualizationData {
  rows: VisualizationDataRow[]
  comparisonColumn: CompFactorCode
  comparisonValues: (string | number)[]
  metadata: {
    vitalName: string
    compName: string
    yLabel: string
    deltaYLabel: string
  }
}

/**
 * Transfusion effect data row from VIZ_{VITAL}_TRANSFUSION.csv
 */
export interface TransfusionDataRow {
  TimeFromTransfusion: number
  PredVal_Base: number
  StdErrVal_Base: number
  PredVal_Full: number
  StdErrVal_Full: number
  Lower_Full: number
  Upper_Full: number
  Delta_Base: number
  Delta_Full: number
  Delta_Lower: number
  Delta_Upper: number
  VitalParam: VitalParamCode
  VitalName: string
  YLabel: string
  DeltaYLabel: string
}

/**
 * LOESS analysis data row from VIZ_LOESS.csv
 */
export interface LoessDataRow {
  TimeFromTransfusion: number
  LoessSmooth: number
  LoessLower: number
  LoessUpper: number
  VitalParam: VitalParamCode
}

/**
 * Summary table row for Table 2a (observed_data_summary.csv)
 */
export interface ObservedDataSummaryRow {
  VitalParam: VitalParamCode
  VitalName: string
  PreTransfusion_Mean: number
  PreTransfusion_SD: number
  PostTransfusion_Mean: number
  PostTransfusion_SD: number
  Change_Mean: number
  Change_SD: number
}

/**
 * Model-based summary row for Table 2a (model_based_summary.csv)
 */
export interface ModelBasedSummaryRow {
  VitalParam: VitalParamCode
  VitalName: string
  Base_Estimate: number
  Base_StdErr: number
  Base_Lower: number
  Base_Upper: number
  Full_Estimate: number
  Full_StdErr: number
  Full_Lower: number
  Full_Upper: number
}

/**
 * Factor summary row for Table 2b
 */
export interface FactorSummaryRow {
  VitalParam: VitalParamCode
  CompFactor: CompFactorCode
  Category: string | number
  CategoryLabel: string
  Estimate: number
  StdErr: number
  Lower: number
  Upper: number
  PValue?: number
}

/**
 * Index entry from viz_index.csv
 */
export interface VizIndexEntry {
  VitalParam: VitalParamCode
  VitalName: string
  CompFactor: CompFactorCode
  CompName: string
  FileName: string
}
```

### 4. Descriptive Statistics Types

**`src/types/statistics.ts`:**

```typescript
/**
 * Patient sex distribution
 */
export interface PatientSexDistribution {
  sex: 'Male' | 'Female'
  count: number
  percentage: number
}

/**
 * Patient age statistics
 */
export interface PatientAgeStats {
  mean: number
  median: number
  sd: number
  min: number
  max: number
  q1: number
  q3: number
}

/**
 * Age group distribution
 */
export interface AgeGroupDistribution {
  ageGroup: string
  count: number
  percentage: number
}

/**
 * RBC units per patient
 */
export interface RbcUnitsPerPatient {
  unitsReceived: number | string  // "1", "2-3", "4-5", "6-10", ">10"
  count: number
  percentage: number
}

/**
 * Donor hemoglobin distribution
 */
export interface DonorHbDistribution {
  category: string
  count: number
  percentage: number
}

/**
 * Storage time distribution
 */
export interface StorageDistribution {
  category: string
  count: number
  percentage: number
}

/**
 * Donor sex distribution
 */
export interface DonorSexDistribution {
  sex: 'Male' | 'Female'
  count: number
  percentage: number
}

/**
 * Donor parity distribution
 */
export interface DonorParityDistribution {
  parity: 'Nulliparous' | 'Parous'
  count: number
  percentage: number
}

/**
 * Donation weekday distribution
 */
export interface DonationWeekdayDistribution {
  weekday: string
  dayNumber: number
  count: number
  percentage: number
}

/**
 * Aggregate type for all descriptive stats
 */
export interface DescriptiveStatistics {
  uniquePatients: number
  totalUnits: number
  patientSex: PatientSexDistribution[]
  patientAge: PatientAgeStats
  ageGroups: AgeGroupDistribution[]
  rbcUnitsPerPatient: RbcUnitsPerPatient[]
  donorHb: DonorHbDistribution[]
  storage: StorageDistribution[]
  donorSex: DonorSexDistribution[]
  donorParity: DonorParityDistribution[]
  donationWeekday: DonationWeekdayDistribution[]
}
```

### 5. Chart Types

**`src/types/charts.ts`:**

```typescript
import type { ChartData, ChartOptions, ChartDataset } from 'chart.js'

/**
 * Time range tuple [min, max] in minutes
 */
export type TimeRange = [number, number]

/**
 * Default time range for charts
 */
export const DEFAULT_TIME_RANGE: TimeRange = [0, 720]

/**
 * Display options for charts
 */
export interface ChartDisplayOptions {
  showConfidenceInterval: boolean
  showBaseModel: boolean
  showDeltaPlot: boolean
}

/**
 * Default display options
 */
export const DEFAULT_DISPLAY_OPTIONS: ChartDisplayOptions = {
  showConfidenceInterval: true,
  showBaseModel: false,
  showDeltaPlot: true,
}

/**
 * Prepared dataset for Chart.js
 */
export interface PreparedDataset {
  label: string
  data: { x: number; y: number }[]
  borderColor: string
  backgroundColor: string
  fill?: boolean | string
  borderWidth?: number
  pointRadius?: number
  tension?: number
  order?: number
}

/**
 * Chart configuration passed to BaseChart
 */
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut'
  data: ChartData
  options: ChartOptions
}

/**
 * Props for chart components
 */
export interface BaseChartProps {
  config: ChartConfig
  height?: number | string
  width?: number | string
  className?: string
  onChartReady?: (chart: Chart) => void
}
```

### 6. Main Index Export

**`src/types/index.ts`:**

```typescript
// Re-export all types
export * from './vitals'
export * from './factors'
export * from './data'
export * from './statistics'
export * from './charts'

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Nullable<T> = T | null

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * File case convention (legacy compatibility)
 */
export type FileCase = 'uppercase' | 'lowercase'
```

---

## Acceptance Criteria

- [ ] All vital parameter codes have corresponding types and info objects
- [ ] All component factor codes have corresponding types and info objects
- [ ] All CSV row schemas are typed
- [ ] Type guards exist for vital params and comp factors
- [ ] No use of `any` type anywhere
- [ ] All exports are properly re-exported from `index.ts`
- [ ] TypeScript strict mode passes with these types
- [ ] JSDoc comments on all public interfaces

---

## Verification

Run type checking:
```bash
npm run typecheck
```

Create a test file that uses these types:
```typescript
// src/types/test.ts (delete after verification)
import { 
  VITAL_PARAMS, 
  COMP_FACTORS, 
  isVitalParamCode,
  type VisualizationDataRow,
  type TimeRange,
  DEFAULT_TIME_RANGE 
} from './index'

// Should compile without errors
const vital = VITAL_PARAMS.ARTm
console.log(vital.displayName) // "MAP"

const factor = COMP_FACTORS.DonorSex
console.log(factor.categories[0].label) // "Male"

const testCode = 'ARTm'
if (isVitalParamCode(testCode)) {
  const info = VITAL_PARAMS[testCode] // No error, narrowed type
}

const range: TimeRange = DEFAULT_TIME_RANGE
console.log(range[0], range[1]) // 0, 720
```

---

## Notes for Agent

1. **Strict Typing**: Do not use `any`. Use `unknown` with type guards if needed.

2. **Const Assertions**: Use `as const` for literal arrays to get narrow types.

3. **Category Values**: Some category values are numbers (1-5), others are strings. The types must handle both.

4. **Metadata Fields**: The metadata in CSV rows (VitalName, CompName, YLabel, DeltaYLabel) appears in row 0 and is the same for all rows in a file.

5. **Future Compatibility**: Types should be easily extendable for additional vital parameters or factors.