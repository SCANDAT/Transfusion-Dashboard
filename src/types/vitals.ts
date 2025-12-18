export const VITAL_PARAM_CODES = [
  'ARTm',
  'ARTs',
  'ARTd',
  'HR',
  'FIO2',
  'SPO2',
  'VE',
] as const

export type VitalParamCode = typeof VITAL_PARAM_CODES[number]

export const VITAL_PARAMS: Record<VitalParamCode, VitalParamInfo> = {
  ARTm: {
    code: 'ARTm',
    name: 'Mean Arterial Pressure',
    shortName: 'MAP',
    unit: 'mmHg',
    yAxisLabel: 'Mean Arterial Pressure (mmHg)',
    deltaYAxisLabel: 'Change in MAP (mmHg)',
    normalRange: [70, 100],
    color: '#6366f1',
  },
  ARTs: {
    code: 'ARTs',
    name: 'Systolic Arterial Pressure',
    shortName: 'SBP',
    unit: 'mmHg',
    yAxisLabel: 'Systolic Pressure (mmHg)',
    deltaYAxisLabel: 'Change in SBP (mmHg)',
    normalRange: [90, 140],
    color: '#8b5cf6',
  },
  ARTd: {
    code: 'ARTd',
    name: 'Diastolic Arterial Pressure',
    shortName: 'DBP',
    unit: 'mmHg',
    yAxisLabel: 'Diastolic Pressure (mmHg)',
    deltaYAxisLabel: 'Change in DBP (mmHg)',
    normalRange: [60, 90],
    color: '#a78bfa',
  },
  HR: {
    code: 'HR',
    name: 'Heart Rate',
    shortName: 'HR',
    unit: 'bpm',
    yAxisLabel: 'Heart Rate (bpm)',
    deltaYAxisLabel: 'Change in HR (bpm)',
    normalRange: [60, 100],
    color: '#ef4444',
  },
  SPO2: {
    code: 'SPO2',
    name: 'Oxygen Saturation',
    shortName: 'SpO2',
    unit: '%',
    yAxisLabel: 'Oxygen Saturation (%)',
    deltaYAxisLabel: 'Change in SpO2 (%)',
    normalRange: [95, 100],
    color: '#10b981',
  },
  FIO2: {
    code: 'FIO2',
    name: 'Fraction of Inspired Oxygen',
    shortName: 'FiO2',
    unit: '%',
    yAxisLabel: 'FiO2 (%)',
    deltaYAxisLabel: 'Change in FiO2 (%)',
    normalRange: [21, 100],
    color: '#06b6d4',
  },
  VE: {
    code: 'VE',
    name: 'Minute Ventilation',
    shortName: 'VE',
    unit: 'L/min',
    yAxisLabel: 'Minute Ventilation (L/min)',
    deltaYAxisLabel: 'Change in VE (L/min)',
    normalRange: [5, 8],
    color: '#f59e0b',
  },
}

export interface VitalParamInfo {
  code: VitalParamCode
  name: string
  shortName: string
  unit: string
  yAxisLabel: string
  deltaYAxisLabel: string
  normalRange: [number, number]
  color: string
}

export const COMP_FACTOR_CODES = [
  'DonorHb_Cat',
  'Storage_Cat',
  'wdy_donation',
  'DonorSex',
  'DonorParity',
] as const

export type CompFactorCode = typeof COMP_FACTOR_CODES[number]

export const COMP_FACTORS: Record<CompFactorCode, CompFactorInfo> = {
  DonorHb_Cat: {
    code: 'DonorHb_Cat',
    name: 'Donor Hemoglobin',
    shortName: 'Donor Hemoglobin',
    description: 'Donor hemoglobin level category at time of donation',
    categories: ['Low', 'Medium', 'High'],
  },
  Storage_Cat: {
    code: 'Storage_Cat',
    name: 'Storage Time',
    shortName: 'Storage Time',
    description: 'Duration of RBC storage before transfusion',
    categories: ['Fresh (0-7d)', 'Medium (8-21d)', 'Old (22-42d)'],
  },
  wdy_donation: {
    code: 'wdy_donation',
    name: 'Donation Weekday',
    shortName: 'Donation Weekday',
    description: 'Day of the week when blood was donated',
    categories: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  DonorSex: {
    code: 'DonorSex',
    name: 'Donor Sex',
    shortName: 'Donor Sex',
    description: 'Biological sex of the blood donor',
    categories: ['Female', 'Male'],
  },
  DonorParity: {
    code: 'DonorParity',
    name: 'Donor Parity',
    shortName: 'Donor Parity',
    description: 'Parity status of female donors',
    categories: ['Nulliparous', 'Parous'],
  },
}

export interface CompFactorInfo {
  code: CompFactorCode
  name: string
  shortName: string
  description: string
  categories: string[]
}

export function isVitalParamCode(value: unknown): value is VitalParamCode {
  return typeof value === 'string' && VITAL_PARAM_CODES.includes(value as VitalParamCode)
}

export function isCompFactorCode(value: unknown): value is CompFactorCode {
  return typeof value === 'string' && COMP_FACTOR_CODES.includes(value as CompFactorCode)
}
