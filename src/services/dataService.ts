import { dataCache } from './cache'
import { fetchCSV } from './csvParser'
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

  try {
    return await fetchCSV<T>(upperPath)
  } catch {
    return await fetchCSV<T>(lowerPath)
  }
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

  const comparisonValues = [...new Set(rows.map(row => row.CompValue))].filter(v => v !== undefined)

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
  dataCache.set(cacheKey, data, 15)
  return data
}

export async function loadLoessData(): Promise<LoessDataRow[]> {
  const cacheKey = 'loess_all'
  const cached = dataCache.get<LoessDataRow[]>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchCSV<LoessDataRow>(`${DATA_BASE_PATH}/VIZ_LOESS.csv`)
    dataCache.set(cacheKey, data, 30)
    return data
  } catch {
    // Silent failure - LOESS data is optional
    return []
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
    const data = await fetchCSV<LoessMultiSpanRow>(`${DATA_BASE_PATH}/VIZ_LOESS_final_with_range.csv`)
    dataCache.set(cacheKey, data, 30)
    return data
  } catch {
    // Silent failure - multi-span LOESS data is optional
    return []
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
    Pred: row[predKey] ?? row.Pred,
    LCL: row[lclKey] ?? row.LCL,
    UCL: row[uclKey] ?? row.UCL,
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

  const totalPatients = patientSexData.reduce((sum, row) => sum + row.No_of_Patients, 0)
  const patientSex: PatientSexDistribution[] = patientSexData.map(row => ({
    sex: row.Patient_Sex === 'U' ? 'Unknown' : row.Patient_Sex,
    count: row.No_of_Patients,
    percentage: (row.No_of_Patients / totalPatients) * 100,
  }))

  const ageRow = patientAgeData[0]
  const patientAge: PatientAgeStats = {
    mean: ageRow?.Mean_Age ?? 0,
    sd: 0,
    median: ageRow?.Median_Age ?? 0,
    q1: ageRow?.Q1_Age ?? 0,
    q3: ageRow?.Q3_Age ?? 0,
    min: ageRow?.Min_Age ?? 0,
    max: ageRow?.Max_Age ?? 0,
  }

  const stats: DescriptiveStatistics = {
    uniquePatients: uniquePatientsData[0]?.No_of_Unique_Patients ?? 0,
    totalUnits: totalUnitsData[0]?.No_of_Transfused_Units ?? 0,
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
        count: row.COUNT || row.count || 0,
        percentage: row.PERCENT || row.percentage || 0,
      }
    }).sort((a, b) => {
      const order = ['<20', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '≥80']
      return order.indexOf(a.ageGroup) - order.indexOf(b.ageGroup)
    }),
    rbcUnitsPerPatient: rbcUnitsData.map((row) => ({
      unitsReceived: row.Unit_Category || row.unitsReceived || 'Unknown',
      count: row.COUNT || row.count || 0,
      percentage: row.Relative_Frequency || row.percentage || 0,
    })),
    donorHb: donorHbData.map((row) => {
      const count = row.No_of_Transfused_Units || 0
      const total = donorHbData.reduce((sum, r) => sum + (r.No_of_Transfused_Units || 0), 0)
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
        percentage: total > 0 ? (count / total) * 100 : 0,
      }
    }).sort((a, b) => {
      const order = ['<125', '125-139', '140-154', '155-169', '≥170']
      return order.indexOf(a.category) - order.indexOf(b.category)
    }),
    donorSex: donorSexData.map((row) => {
      const count = row.No_of_Transfused_Units || 0
      const total = donorSexData.reduce((sum, r) => sum + (r.No_of_Transfused_Units || 0), 0)
      const rawSex = row.donor_sex_label || row.sex || 'Unknown'
      return {
        sex: rawSex === 'U' ? 'Unknown' : rawSex,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }
    }),
    donorParity: donorParityData.map((row) => {
      const count = row.No_of_Transfused_Units || 0
      const total = donorParityData.reduce((sum, r) => sum + (r.No_of_Transfused_Units || 0), 0)
      const parityMap: Record<string, string> = {
        '0': 'Nulliparous', '1': 'Parous'
      }
      const rawParity = row.donor_parity_label !== undefined ? String(row.donor_parity_label) : (row.parity || 'Unknown')
      return {
        parity: parityMap[rawParity] || rawParity,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }
    }),
    donationWeekday: donationWeekdayData.map((row) => {
      const count = row.No_of_Transfused_Units || 0
      const total = donationWeekdayData.reduce((sum, r) => sum + (r.No_of_Transfused_Units || 0), 0)
      const dayMap: Record<string, string> = {
        '1': 'Sunday', '2': 'Monday', '3': 'Tuesday', '4': 'Wednesday',
        '5': 'Thursday', '6': 'Friday', '7': 'Saturday'
      }
      const dayNum = String(row.wdy_donation || row.dayNumber || '')
      return {
        dayNumber: parseInt(dayNum) || 0,
        weekday: dayMap[dayNum] || dayNum,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }
    }),
    storage: storageData.map((row) => {
      const count = row.No_of_Transfused_Units || 0
      const total = storageData.reduce((sum, r) => sum + (r.No_of_Transfused_Units || 0), 0)
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
        percentage: total > 0 ? (count / total) * 100 : 0,
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
    loadObservedDataSummary(),
    loadModelBasedSummary(),
    loadLoessData(),
    loadFactorObservedSummary(),
    loadFactorModelSummary(),
  ])
}

export function clearDataCache(): void {
  dataCache.clear()
}
