export interface PatientSexDistribution {
  sex: 'Male' | 'Female' | string
  count: number
  percentage: number
}

export interface PatientAgeStats {
  mean: number
  median: number
  sd: number
  min: number
  max: number
  q1: number
  q3: number
}

export interface AgeGroupDistribution {
  ageGroup: string
  Age_Group?: string
  count: number
  COUNT?: number
  percentage: number
  PERCENT?: number
}

export interface RbcUnitsPerPatient {
  unitsReceived: number | string
  Unit_Category?: string
  count: number
  COUNT?: number
  percentage: number
  Relative_Frequency?: number
}

export interface DonorHbDistribution {
  category: string
  donorhb_category?: string
  count: number
  No_of_Transfused_Units?: number
  percentage: number
}

export interface StorageDistribution {
  category: string
  count: number
  percentage: number
}

export interface DonorSexDistribution {
  sex: 'Male' | 'Female' | string
  count: number
  percentage: number
}

export interface DonorParityDistribution {
  parity: 'Nulliparous' | 'Parous' | string
  count: number
  percentage: number
}

export interface DonationWeekdayDistribution {
  weekday: string
  dayNumber: number
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
  storage: StorageDistribution[]
  donorSex: DonorSexDistribution[]
  donorParity: DonorParityDistribution[]
  donationWeekday: DonationWeekdayDistribution[]
}
