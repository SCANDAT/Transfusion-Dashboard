/**
 * Patient sex distribution
 */
export interface PatientSexDistribution {
  sex: 'Male' | 'Female' | string
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
  Age_Group?: string
  count: number
  COUNT?: number
  percentage: number
  PERCENT?: number
}

/**
 * RBC units per patient
 */
export interface RbcUnitsPerPatient {
  unitsReceived: number | string  // "1", "2-3", "4-5", "6-10", ">10"
  Unit_Category?: string
  count: number
  COUNT?: number
  percentage: number
  Relative_Frequency?: number
}

/**
 * Donor hemoglobin distribution
 */
export interface DonorHbDistribution {
  category: string
  donorhb_category?: string
  count: number
  No_of_Transfused_Units?: number
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
  sex: 'Male' | 'Female' | string
  count: number
  percentage: number
}

/**
 * Donor parity distribution
 */
export interface DonorParityDistribution {
  parity: 'Nulliparous' | 'Parous' | string
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
