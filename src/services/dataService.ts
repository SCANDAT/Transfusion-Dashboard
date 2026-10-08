import { getFactorCategoryLabel } from '@/utils/factorLabels'
import { dataCache } from './cache'
import { CSVFetchError, CSVParseError, fetchCSV, fetchCSVWithFallback as fetchPaths } from './csvParser'
import type {
  VitalParamCode,
  CompFactorCode,
  VizIndexEntry,
  VisualizationData,
  VisualizationDataRow,
  TransfusionDataRow,
  LoessDataRow,
  LoessMultiSpanRow,
  ObservedSummaryRow,
  ModelSummaryRow,
  FactorObservedSummaryRow,
  FactorModelSummaryRow,
  VitalSummaryRow,
  ModelVitalSummaryRow,
  DescriptiveStatistics,
  PatientSexDistribution,
  PatientAgeStats,
} from '@/types'
import { VITAL_PARAMS, COMP_FACTORS, VITAL_PARAM_CODES, COMP_FACTOR_CODES } from '@/types'

interface RawAgeGroupRow {
  Age_Group?: string
  ageGroup?: string
  COUNT?: number
  count?: number
  PERCENT?: number
  percentage?: number
}

interface RawRbcUnitsRow {
  Unit_Category?: string
  unitsReceived?: string
  COUNT?: number
  count?: number
  Relative_Frequency?: number
  percentage?: number
}

interface RawDonorHbRow {
  donorhb_category?: string
  category?: string
  No_of_Transfused_Units?: number
}

interface RawDonorSexRow {
  donor_sex_label?: string
  sex?: string
  No_of_Transfused_Units?: number
}

interface RawDonorParityRow {
  donor_parity_label?: string | number
  parity?: string
  No_of_Transfused_Units?: number
}

interface RawDonationWeekdayRow {
  wdy_donation?: string | number
  dayNumber?: string | number
  No_of_Transfused_Units?: number
}

interface RawStorageRow {
  storagecat?: string
  Storage_Category?: string
  No_of_Transfused_Units?: number
}

const DATA_BASE_PATH = `${import.meta.env.BASE_URL}data`

async function fetchCSVWithFallback<T>(fileName: string): Promise<T[]> {
  const baseName = fileName.replace(/\.csv$/i, '')
  const upperPath = `${DATA_BASE_PATH}/${baseName.toUpperCase()}.csv`
  const lowerPath = `${DATA_BASE_PATH}/${baseName.toLowerCase()}.csv`

  return fetchPaths<T>([upperPath, lowerPath])
}

export async function loadVizIndex(): Promise<VizIndexEntry[]> {
  const cacheKey = 'viz_index'
  const cached = dataCache.get<VizIndexEntry[]>(cacheKey)
  if (cached) return cached

  const data = await fetchCSV<VizIndexEntry>(`${DATA_BASE_PATH}/viz_index.csv`)
  dataCache.set(cacheKey, data, 30)
  return data
}

export async function getAvailableVitalParams(): Promise<VitalParamCode[]> {
  const index = await loadVizIndex()
  const vitalsSet = new Set(index.map(entry => entry.VitalParam))
  return VITAL_PARAM_CODES.filter(code => vitalsSet.has(code))
}

export async function getAvailableCompFactors(
  vitalParam: VitalParamCode
): Promise<CompFactorCode[]> {
  const index = await loadVizIndex()
  const factorsSet = new Set(
    index
      .filter(entry => entry.VitalParam === vitalParam)
      .map(entry => entry.CompFactor)
  )
  return COMP_FACTOR_CODES.filter(code => factorsSet.has(code))
}

function validateTrajectoryRows(
  rows: (TransfusionDataRow | VisualizationDataRow)[],
  vitalParam: VitalParamCode,
  compFactor?: CompFactorCode
): void {
  const requiredFields = ['PredVal_Full', 'Lower_Full', 'Upper_Full', 'Delta_Full']
  const optionalFields = ['PredVal_Base', 'Lower_Base', 'Upper_Base', 'Delta_Base', 'Delta_Lower', 'Delta_Upper']
  for (const row of rows) {
    requiredNumber(row.TimeFromTransfusion, 'TimeFromTransfusion')
    if (normalizeVitalAbbreviation(row.VitalParam) !== vitalParam) throw new CSVParseError('Trajectory vital-parameter code does not match the requested file.')
    const record = row as unknown as Record<string, unknown>
    for (const field of [...requiredFields, ...optionalFields]) {
      if (!(field in record)) {
        if (requiredFields.includes(field)) throw new CSVParseError(`Missing trajectory column: ${field}.`)
        continue
      }
      const value = record[field]
      // Blank/SAS-missing estimates remain gaps; they must never become zero.
      if (value !== null && value !== '.') requiredNumber(value, field)
    }
    if (compFactor) {
      if (record.CompFactor !== compFactor) throw new CSVParseError('Trajectory factor code does not match the requested file.')
      const category = record.CompValue
      if (!((typeof category === 'string' && category.length > 0) ||
            (typeof category === 'number' && Number.isFinite(category)))) {
        throw new CSVParseError('Missing or invalid trajectory category.')
      }
    }
  }
}

export async function loadVisualizationData(
  vitalParam: VitalParamCode,
  compFactor: CompFactorCode
): Promise<VisualizationData> {
  const cacheKey = `viz_${vitalParam}_${compFactor}`
  const cached = dataCache.get<VisualizationData>(cacheKey)
  if (cached) return cached

  const fileName = `VIZ_${vitalParam}_${compFactor}.csv`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawRows = await fetchCSVWithFallback<any>(fileName)

  const rows: VisualizationDataRow[] = rawRows.map((row) => ({
    ...row,
    CompValue: row[compFactor] ?? row.CompValue,
  }))

  validateTrajectoryRows(rows, vitalParam, compFactor)
  const comparisonValues = [...new Set(rows.map(row => row.CompValue))]

  const vitalInfo = VITAL_PARAMS[vitalParam]
  const compInfo = COMP_FACTORS[compFactor]

  const data: VisualizationData = {
    rows,
    metadata: {
      vitalParam,
      vitalName: vitalInfo.name,
      compFactor,
      compName: compInfo.name,
      yLabel: vitalInfo.yAxisLabel,
      deltaYLabel: vitalInfo.deltaYAxisLabel,
      timeRange: [
        Math.min(...rows.map(r => r.TimeFromTransfusion)),
        Math.max(...rows.map(r => r.TimeFromTransfusion)),
      ],
      dataPoints: rows.length,
    },
    comparisonColumn: compFactor,
    comparisonValues,
  }

  dataCache.set(cacheKey, data, 15)
  return data
}

export async function loadTransfusionData(
  vitalParam: VitalParamCode
): Promise<TransfusionDataRow[]> {
  const cacheKey = `transfusion_${vitalParam}`
  const cached = dataCache.get<TransfusionDataRow[]>(cacheKey)
  if (cached) return cached

  const fileName = `VIZ_${vitalParam}_TRANSFUSION.csv`
  const data = await fetchCSVWithFallback<TransfusionDataRow>(fileName)
  validateTrajectoryRows(data, vitalParam)
  dataCache.set(cacheKey, data, 15)
  return data
}

export async function loadLoessData(): Promise<LoessDataRow[]> {
  const cacheKey = 'loess_all'
  const cached = dataCache.get<LoessDataRow[]>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchCSV<LoessDataRow>(`${DATA_BASE_PATH}/VIZ_LOESS.csv`, { encoding: 'windows-1252' })
    dataCache.set(cacheKey, data, 30)
    return data
  } catch (error) {
    if (error instanceof CSVFetchError && error.status === 404) return []
    throw error
  }
}

export async function getLoessDataForVital(
  vitalParam: VitalParamCode
): Promise<LoessDataRow[]> {
  const cacheKey = `loess_${vitalParam}`
  const cached = dataCache.get<LoessDataRow[]>(cacheKey)
  if (cached) return cached

  const allLoess = await loadLoessData()
  const filtered = allLoess.filter(row =>
    row.VitalParam === vitalParam || row.Abbreviation === vitalParam
  )
  dataCache.set(cacheKey, filtered, 30)
  return filtered
}

export async function loadLoessMultiSpanData(): Promise<LoessMultiSpanRow[]> {
  const cacheKey = 'loess_multispan_all'
  const cached = dataCache.get<LoessMultiSpanRow[]>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchCSV<LoessMultiSpanRow>(`${DATA_BASE_PATH}/VIZ_LOESS_final_with_range.csv`, { encoding: 'windows-1252' })
    dataCache.set(cacheKey, data, 30)
    return data
  } catch (error) {
    if (error instanceof CSVFetchError && error.status === 404) return []
    throw error
  }
}

export const LOESS_SPAN_VALUES = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90] as const

export type LoessSpanValue = typeof LOESS_SPAN_VALUES[number]

export function extractLoessForSpan(
  data: LoessMultiSpanRow[],
  span: LoessSpanValue
): LoessDataRow[] {
  const predKey = `Pred_${span}`
  const lclKey = `LCL_${span}`
  const uclKey = `UCL_${span}`

  return data.map(row => ({
    TimeFromTransfusion: row.TimeFromTransfusion,
    VitalParam: row.VitalParam,
    Abbreviation: row.Abbreviation,
    Pred: row[predKey],
    LCL: row[lclKey],
    UCL: row[uclKey],
  }))
}

export async function loadObservedDataSummary(): Promise<ObservedSummaryRow[]> {
  const cacheKey = 'observed_summary'
  const cached = dataCache.get<ObservedSummaryRow[]>(cacheKey)
  if (cached) return cached

  const data = await fetchCSV<ObservedSummaryRow>(`${DATA_BASE_PATH}/observed_data_summary.csv`)
  dataCache.set(cacheKey, data, 30)
  return data
}

export async function loadModelBasedSummary(): Promise<ModelSummaryRow[]> {
  const cacheKey = 'model_summary'
  const cached = dataCache.get<ModelSummaryRow[]>(cacheKey)
  if (cached) return cached

  const data = await fetchCSV<ModelSummaryRow>(`${DATA_BASE_PATH}/model_based_summary.csv`)
  dataCache.set(cacheKey, data, 30)
  return data
}

function requiredNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new CSVParseError(`Missing or invalid numeric column: ${field}.`)
  }
  return value
}

function requiredCount(value: unknown, field: string): number {
  const count = requiredNumber(value, field)
  if (!Number.isInteger(count) || count < 0) {
    throw new CSVParseError(`Invalid count column: ${field}.`)
  }
  return count
}

function distributionTotal(rows: { No_of_Transfused_Units?: number }[], field: string): number {
  const total = rows.reduce((sum, row) => sum + requiredCount(row.No_of_Transfused_Units, field), 0)
  if (!Number.isFinite(total) || total <= 0) {
    throw new CSVParseError(`Invalid distribution total: ${field}.`)
  }
  return total
}

export async function loadDescriptiveStatistics(): Promise<DescriptiveStatistics> {
  const cacheKey = 'descriptive_stats'
  const cached = dataCache.get<DescriptiveStatistics>(cacheKey)
  if (cached) return cached

  const [
    uniquePatientsData,
    totalUnitsData,
    patientSexData,
    patientAgeData,
    ageGroupsData,
    rbcUnitsData,
    donorHbData,
    donorSexData,
    donorParityData,
    donationWeekdayData,
    storageData,
  ] = await Promise.all([
    fetchCSV<{ No_of_Unique_Patients: number }>(`${DATA_BASE_PATH}/unique_patients_count.csv`),
    fetchCSV<{ No_of_Transfused_Units: number }>(`${DATA_BASE_PATH}/total_transfused_units.csv`),
    fetchCSV<{ Patient_Sex: string; No_of_Patients: number }>(`${DATA_BASE_PATH}/patient_sex_distribution.csv`),
    fetchCSV<{ Mean_Age: number; Median_Age: number; Min_Age: number; Max_Age: number; Q1_Age: number; Q3_Age: number }>(`${DATA_BASE_PATH}/patient_age_stats.csv`),
    fetchCSV<RawAgeGroupRow>(`${DATA_BASE_PATH}/patient_age_groups.csv`),
    fetchCSV<RawRbcUnitsRow>(`${DATA_BASE_PATH}/rbc_units_per_patient.csv`),
    fetchCSV<RawDonorHbRow>(`${DATA_BASE_PATH}/donorhb_distribution.csv`),
    fetchCSV<RawDonorSexRow>(`${DATA_BASE_PATH}/donor_sex_distribution.csv`),
    fetchCSV<RawDonorParityRow>(`${DATA_BASE_PATH}/donor_parity_distribution.csv`),
    fetchCSV<RawDonationWeekdayRow>(`${DATA_BASE_PATH}/donation_weekday_distribution.csv`),
    fetchCSV<RawStorageRow>(`${DATA_BASE_PATH}/storage_distribution.csv`),
  ])

  if (uniquePatientsData.length !== 1 || totalUnitsData.length !== 1 || patientAgeData.length !== 1) {
    throw new CSVParseError('Expected one row in each cohort-count and age-summary file.')
  }
  const totalPatients = patientSexData.reduce((sum, row) => sum + requiredCount(row.No_of_Patients, 'No_of_Patients'), 0)
  if (!Number.isFinite(totalPatients) || totalPatients <= 0) {
    throw new CSVParseError('Invalid patient-sex distribution total.')
  }
  const donorHbTotal = distributionTotal(donorHbData, 'donorhb_distribution.No_of_Transfused_Units')
  const donorSexTotal = distributionTotal(donorSexData, 'donor_sex_distribution.No_of_Transfused_Units')
  const donorParityTotal = distributionTotal(donorParityData, 'donor_parity_distribution.No_of_Transfused_Units')
  const donationWeekdayTotal = distributionTotal(donationWeekdayData, 'donation_weekday_distribution.No_of_Transfused_Units')
  const storageTotal = distributionTotal(storageData, 'storage_distribution.No_of_Transfused_Units')
  const patientSex: PatientSexDistribution[] = patientSexData.map(row => ({
    sex: row.Patient_Sex === 'U' ? 'Unknown' : row.Patient_Sex,
    count: row.No_of_Patients,
    percentage: (row.No_of_Patients / totalPatients) * 100,
  }))

  const ageRow = patientAgeData[0]
  const patientAge: PatientAgeStats = {
    mean: requiredNumber(ageRow?.Mean_Age, 'Mean_Age'),
    median: requiredNumber(ageRow?.Median_Age, 'Median_Age'),
    q1: requiredNumber(ageRow?.Q1_Age, 'Q1_Age'),
    q3: requiredNumber(ageRow?.Q3_Age, 'Q3_Age'),
    min: requiredNumber(ageRow?.Min_Age, 'Min_Age'),
    max: requiredNumber(ageRow?.Max_Age, 'Max_Age'),
  }

  const stats: DescriptiveStatistics = {
    uniquePatients: requiredCount(uniquePatientsData[0]?.No_of_Unique_Patients, 'No_of_Unique_Patients'),
    totalUnits: requiredCount(totalUnitsData[0]?.No_of_Transfused_Units, 'No_of_Transfused_Units'),
    patientSex,
    patientAge,
    ageGroups: (ageGroupsData as RawAgeGroupRow[]).map((row) => {
      const rawGroup = row.Age_Group || row.ageGroup || 'Unknown'
      const ageGroupMap: Record<string, string> = {
        '<20': '<20',
        '20-': '20-29',
        '30-': '30-39',
        '40-': '40-49',
        '50-': '50-59',
        '60-': '60-69',
        '70-': '70-79',
        '80+': '≥80',
      }
      return {
        ageGroup: ageGroupMap[rawGroup] || rawGroup,
        count: requiredCount(row.COUNT ?? row.count, 'COUNT'),
        percentage: requiredNumber(row.PERCENT ?? row.percentage, 'PERCENT'),
      }
    }).sort((a, b) => {
      const order = ['<20', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '≥80']
      return order.indexOf(a.ageGroup) - order.indexOf(b.ageGroup)
    }),
    rbcUnitsPerPatient: rbcUnitsData.map((row) => ({
      unitsReceived: row.Unit_Category || row.unitsReceived || 'Unknown',
      count: requiredCount(row.COUNT ?? row.count, 'COUNT'),
      percentage: requiredNumber(row.Relative_Frequency ?? row.percentage, 'Relative_Frequency'),
    })),
    donorHb: donorHbData.map((row) => {
      const count = requiredCount(row.No_of_Transfused_Units, 'No_of_Transfused_Units')
      const total = donorHbTotal
      const rawCategory = row.donorhb_category || row.category || 'Unknown'
      const hbMap: Record<string, string> = {
        '<125': '<125',
        '125-139': '125-139',
        '140-154': '140-154',
        '155-169': '155-169',
        '>=170': '≥170',
      }
      return {
        category: hbMap[rawCategory] || rawCategory,
        count,
        percentage: (count / total) * 100,
      }
    }).sort((a, b) => {
      const order = ['<125', '125-139', '140-154', '155-169', '≥170']
      return order.indexOf(a.category) - order.indexOf(b.category)
    }),
    donorSex: donorSexData.map((row) => {
      const count = requiredCount(row.No_of_Transfused_Units, 'No_of_Transfused_Units')
      const total = donorSexTotal
      const rawSex = row.donor_sex_label || row.sex || 'Unknown'
      return {
        sex: rawSex === 'U' ? 'Unknown' : rawSex,
        count,
        percentage: (count / total) * 100,
      }
    }),
    donorParity: donorParityData.map((row) => {
      const count = requiredCount(row.No_of_Transfused_Units, 'No_of_Transfused_Units')
      const total = donorParityTotal
      const rawParity = row.donor_parity_label ?? row.parity
      return {
        parity: getFactorCategoryLabel('DonorParity', rawParity),
        count,
        percentage: (count / total) * 100,
      }
    }),
    donationWeekday: donationWeekdayData.map((row) => {
      const count = requiredCount(row.No_of_Transfused_Units, 'No_of_Transfused_Units')
      const total = donationWeekdayTotal
      const dayMap: Record<string, string> = {
        '1': 'Sunday', '2': 'Monday', '3': 'Tuesday', '4': 'Wednesday',
        '5': 'Thursday', '6': 'Friday', '7': 'Saturday'
      }
      const dayNum = String(row.wdy_donation ?? row.dayNumber ?? '')
      if (!/^[1-7]$/.test(dayNum)) throw new CSVParseError('Invalid donation weekday code.')
      return {
        dayNumber: Number(dayNum),
        weekday: dayMap[dayNum] || dayNum,
        count,
        percentage: (count / total) * 100,
      }
    }),
    storage: storageData.map((row) => {
      const count = requiredCount(row.No_of_Transfused_Units, 'No_of_Transfused_Units')
      const total = storageTotal
      const rawCategory = row.storagecat || row.Storage_Category || 'Unknown'
      const storageMap: Record<string, string> = {
        '<10': '<10',
        '10-19': '10-19',
        '20-29': '20-29',
        '30-39': '30-39',
        '>=40': '≥40',
      }
      return {
        category: storageMap[rawCategory] || rawCategory,
        count,
        percentage: (count / total) * 100,
      }
    }).sort((a, b) => {
      const order = ['<10', '10-19', '20-29', '30-39', '≥40']
      return order.indexOf(a.category) - order.indexOf(b.category)
    }),
  }

  dataCache.set(cacheKey, stats, 30)
  return stats
}

export async function loadFactorObservedSummary(): Promise<FactorObservedSummaryRow[]> {
  const cacheKey = 'factor_observed_summary'
  const cached = dataCache.get<FactorObservedSummaryRow[]>(cacheKey)
  if (cached) return cached

  const data = await fetchCSV<FactorObservedSummaryRow>(`${DATA_BASE_PATH}/factor_observed_data_summary.csv`)

  const normalizedData = data.map(row => ({
    ...row,
    Abbreviation: normalizeVitalAbbreviation(row.Abbreviation) as VitalParamCode,
  }))

  dataCache.set(cacheKey, normalizedData, 30)
  return normalizedData
}

export async function loadFactorModelSummary(): Promise<FactorModelSummaryRow[]> {
  const cacheKey = 'factor_model_summary'
  const cached = dataCache.get<FactorModelSummaryRow[]>(cacheKey)
  if (cached) return cached

  const data = await fetchCSV<FactorModelSummaryRow>(`${DATA_BASE_PATH}/factor_model_based_summary.csv`)

  const normalizedData = data.map(row => ({
    ...row,
    Abbreviation: normalizeVitalAbbreviation(row.Abbreviation) as VitalParamCode,
  }))

  dataCache.set(cacheKey, normalizedData, 30)
  return normalizedData
}

function normalizeVitalAbbreviation(abbrev: string | undefined): string {
  if (!abbrev) return ''
  const normalized = abbrev.replace(/\(u\)$/i, '')

  if (normalized === 'Hjärtfrekv' || normalized.toLowerCase() === 'hjärtfrekv') {
    return 'HR'
  }

  if (normalized.toLowerCase() === 'spo2') {
    return 'SPO2'
  }
  if (normalized.toLowerCase() === 'fio2') {
    return 'FIO2'
  }
  if (normalized.toLowerCase() === 've') {
    return 'VE'
  }

  return normalized
}

export async function loadVitalSummary(): Promise<VitalSummaryRow[]> {
  const cacheKey = 'vital_summary'
  const cached = dataCache.get<VitalSummaryRow[]>(cacheKey)
  if (cached) return cached

  const data = await fetchCSV<VitalSummaryRow>(`${DATA_BASE_PATH}/observed_data_summary.csv`)

  const normalizedData = data.map(row => ({
    ...row,
    Abbreviation: normalizeVitalAbbreviation(row.Abbreviation) as VitalSummaryRow['Abbreviation'],
  }))

  dataCache.set(cacheKey, normalizedData, 30)
  return normalizedData
}

export async function loadModelVitalSummary(): Promise<ModelVitalSummaryRow[]> {
  const cacheKey = 'model_vital_summary'
  const cached = dataCache.get<ModelVitalSummaryRow[]>(cacheKey)
  if (cached) return cached

  const data = await fetchCSV<ModelVitalSummaryRow>(`${DATA_BASE_PATH}/model_based_summary.csv`)

  const normalizedData = data.map(row => ({
    ...row,
    Abbreviation: normalizeVitalAbbreviation(row.Abbreviation) as ModelVitalSummaryRow['Abbreviation'],
  }))

  dataCache.set(cacheKey, normalizedData, 30)
  return normalizedData
}

export async function preloadData(): Promise<void> {
  await Promise.all([
    loadVizIndex(),
    loadVitalSummary(),
    loadModelVitalSummary(),
    loadFactorObservedSummary(),
    loadFactorModelSummary(),
  ])
}

export function clearDataCache(): void {
  dataCache.clear()
}
