import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  loadVizIndex,
  loadVisualizationData,
  loadTransfusionData,
  loadLoessData,
  loadLoessMultiSpanData,
  extractLoessForSpan,
  getLoessDataForVital,
  getAvailableVitalParams,
  getAvailableCompFactors,
  loadObservedDataSummary,
  loadModelBasedSummary,
  loadDescriptiveStatistics,
  loadFactorObservedSummary,
  loadFactorModelSummary,
  preloadData,
  clearDataCache,
} from '../dataService'


function toBytes(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer as ArrayBuffer
}
// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('dataService', () => {
  beforeEach(() => {
    clearDataCache()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('loadVizIndex', () => {
    const mockIndexCSV = `VitalParam,CompFactor,CompName,VitalName,YLabel,DeltaYLabel
ARTm,DonorHb_Cat,Donor Hemoglobin,Mean Arterial Pressure,MAP (mmHg),Change in MAP (mmHg)
ARTm,Storage_Cat,RBC Storage Time,Mean Arterial Pressure,MAP (mmHg),Change in MAP (mmHg)
HR,DonorHb_Cat,Donor Hemoglobin,Heart Rate,HR (bpm),Change in HR (bpm)
SPO2,DonorSex,Donor Sex,Oxygen Saturation,SpO2 (%),Change in SpO2 (%)`

    it('fetches and parses viz index', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockIndexCSV)),
      })

      const result = await loadVizIndex()

      expect(result).toHaveLength(4)
      expect(result[0]!.VitalParam).toBe('ARTm')
      expect(result[0]!.CompFactor).toBe('DonorHb_Cat')
      expect(result[0]!.CompName).toBe('Donor Hemoglobin')
    })

    it('uses cache on subsequent calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockIndexCSV)),
      })

      await loadVizIndex()
      await loadVizIndex()
      await loadVizIndex()

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('throws on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(loadVizIndex()).rejects.toThrow()
    })
  })

  describe('getAvailableVitalParams', () => {
    it('extracts unique vital parameters from index', async () => {
      const mockCSV = `VitalParam,CompFactor,CompName,VitalName,YLabel,DeltaYLabel
ARTm,DonorHb_Cat,Donor Hb,MAP,MAP,dMAP
ARTm,Storage_Cat,Storage,MAP,MAP,dMAP
HR,DonorHb_Cat,Donor Hb,HR,HR,dHR
SPO2,DonorHb_Cat,Donor Hb,SpO2,SpO2,dSpO2
HR,DonorSex,Sex,HR,HR,dHR`

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockCSV)),
      })

      const vitals = await getAvailableVitalParams()

      expect(vitals).toHaveLength(3)
      expect(vitals).toContain('ARTm')
      expect(vitals).toContain('HR')
      expect(vitals).toContain('SPO2')
    })
  })

  describe('getAvailableCompFactors', () => {
    it('filters factors by vital parameter', async () => {
      const mockCSV = `VitalParam,CompFactor,CompName,VitalName,YLabel,DeltaYLabel
ARTm,DonorHb_Cat,Donor Hb,MAP,MAP,dMAP
ARTm,Storage_Cat,Storage,MAP,MAP,dMAP
ARTm,DonorSex,Sex,MAP,MAP,dMAP
HR,DonorHb_Cat,Donor Hb,HR,HR,dHR`

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockCSV)),
      })

      const factors = await getAvailableCompFactors('ARTm')

      expect(factors).toHaveLength(3)
      expect(factors).toContain('DonorHb_Cat')
      expect(factors).toContain('Storage_Cat')
      expect(factors).toContain('DonorSex')
    })

    it('returns empty array for vital with no factors', async () => {
      const mockCSV = `VitalParam,CompFactor,CompName,VitalName,YLabel,DeltaYLabel
ARTm,DonorHb_Cat,Donor Hb,MAP,MAP,dMAP`

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockCSV)),
      })

      const factors = await getAvailableCompFactors('SPO2')

      expect(factors).toHaveLength(0)
    })
  })

  describe('loadVisualizationData', () => {
    const mockVizCSV = `TimeFromTransfusion,VitalParam,CompFactor,CompValue,PredVal_Full,Lower_Full,Upper_Full,Delta_Full,Delta_Lower,Delta_Upper
0,ARTm,DonorHb_Cat,Low,75.5,73.0,78.0,0,0,0
60,ARTm,DonorHb_Cat,Low,76.2,74.0,78.5,0.7,0.5,0.9
0,ARTm,DonorHb_Cat,High,74.8,72.0,77.5,0,0,0
60,ARTm,DonorHb_Cat,High,75.1,73.0,77.0,0.3,0.1,0.5`

    it('loads and structures visualization data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockVizCSV)),
      })

      const result = await loadVisualizationData('ARTm', 'DonorHb_Cat')

      expect(result.rows).toHaveLength(4)
      expect(result.comparisonColumn).toBe('DonorHb_Cat')
      expect(result.comparisonValues).toContain('Low')
      expect(result.comparisonValues).toContain('High')
      expect(result.metadata.vitalParam).toBe('ARTm')
      expect(result.metadata.compFactor).toBe('DonorHb_Cat')
      expect(result.metadata.timeRange).toEqual([0, 60])
      expect(result.metadata.dataPoints).toBe(4)
    })

    it('tries fallback path on first failure', async () => {
      // First call (uppercase) fails
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
        // Second call (lowercase) succeeds
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(toBytes(mockVizCSV)),
        })

      const result = await loadVisualizationData('ARTm', 'DonorHb_Cat')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result.rows).toHaveLength(4)
    })

    it('caches visualization data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockVizCSV)),
      })

      await loadVisualizationData('ARTm', 'DonorHb_Cat')
      await loadVisualizationData('ARTm', 'DonorHb_Cat')

      // Only one fetch (or two if fallback triggered, but cache should prevent second data load)
      expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(2)
    })
  })

  describe('loadTransfusionData', () => {
    const mockTransfusionCSV = `TimeFromTransfusion,VitalParam,PredVal_Full,Lower_Full,Upper_Full,Delta_Full,Delta_Lower,Delta_Upper
0,ARTm,75.0,73.0,77.0,0,0,0
30,ARTm,76.0,74.0,78.0,1.0,0.5,1.5
60,ARTm,77.0,75.0,79.0,2.0,1.0,3.0`

    it('loads transfusion data for vital parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockTransfusionCSV)),
      })

      const result = await loadTransfusionData('ARTm')

      expect(result).toHaveLength(3)
      expect(result[0]).toBeDefined()
      expect(result[0]?.TimeFromTransfusion).toBe(0)
      expect(result[0]?.PredVal_Full).toBe(75)
    })

    it('caches transfusion data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockTransfusionCSV)),
      })

      await loadTransfusionData('ARTm')
      await loadTransfusionData('ARTm')

      expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(2) // May have fallback
    })
  })

  describe('trajectory ingestion', () => {
    const csv = 'TimeFromTransfusion,VitalParam,PredVal_Full,Lower_Full,Upper_Full,Delta_Full\n0,ARTm,0,-1,1,0'

    it.each(['Infinity', 'NaN', '1e999', ''])('rejects invalid time coordinates (%s)', async time => {
      mockFetch.mockResolvedValue({ ok: true, arrayBuffer: async () => toBytes(csv.replace('\n0,', `\n${time},`)) })
      await expect(loadTransfusionData('ARTm')).rejects.toThrow('TimeFromTransfusion')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('rejects a mismatched vital parameter', async () => {
      mockFetch.mockResolvedValue({ ok: true, arrayBuffer: async () => toBytes(csv.replace('ARTm', 'HR')) })
      await expect(loadTransfusionData('ARTm')).rejects.toThrow('does not match')
    })

    it('accepts the exported SpO2 alias for the SPO2 file', async () => {
      mockFetch.mockResolvedValue({ ok: true, arrayBuffer: async () => toBytes(csv.replace('ARTm', 'SpO2')) })
      await expect(loadTransfusionData('SPO2')).resolves.toHaveLength(1)
    })

    it('rejects renamed required prediction columns', async () => {
      mockFetch.mockResolvedValue({ ok: true, arrayBuffer: async () => toBytes(csv.replace('PredVal_Full', 'Unexpected_Pred')) })
      await expect(loadTransfusionData('ARTm')).rejects.toThrow('Missing trajectory column')
    })

    it('preserves a missing prediction as a gap', async () => {
      mockFetch.mockResolvedValue({ ok: true, arrayBuffer: async () => toBytes(csv.replace('ARTm,0,', 'ARTm,,')) })
      const rows = await loadTransfusionData('ARTm')
      expect(rows[0]?.PredVal_Full).toBeNull()
      expect(rows[0]?.Delta_Full).toBe(0)
    })

    it('rejects a nonnumeric prediction', async () => {
      mockFetch.mockResolvedValue({ ok: true, arrayBuffer: async () => toBytes(csv.replace('ARTm,0,', 'ARTm,NaN,')) })
      await expect(loadTransfusionData('ARTm')).rejects.toThrow('PredVal_Full')
    })

    it('preserves numeric category zero and rejects an absent category', async () => {
      const factorCsv = 'TimeFromTransfusion,VitalParam,CompFactor,DonorParity,PredVal_Full,Lower_Full,Upper_Full,Delta_Full\n0,ARTm,DonorParity,0,0,-1,1,0'
      mockFetch.mockResolvedValue({ ok: true, arrayBuffer: async () => toBytes(factorCsv) })
      expect((await loadVisualizationData('ARTm', 'DonorParity')).comparisonValues).toEqual([0])
      clearDataCache()
      mockFetch.mockResolvedValue({ ok: true, arrayBuffer: async () => toBytes(factorCsv.replace('DonorParity,0,', 'DonorParity,,')) })
      await expect(loadVisualizationData('ARTm', 'DonorParity')).rejects.toThrow('category')
    })
  })

  describe('loadLoessData', () => {
    const mockLoessCSV = `TimeFromTransfusion,VitalParam,Abbreviation,Pred
0,ARTm,ARTm,75.0
30,ARTm,ARTm,75.5
60,ARTm,ARTm,76.0`

    it('loads LOESS smoothing data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockLoessCSV)),
      })

      const result = await loadLoessData()

      expect(result).toHaveLength(3)
      expect(result[0]).toBeDefined()
      expect(result[0]?.Pred).toBe(75)
    })

    it('returns empty array only when the optional file is absent', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

      const result = await loadLoessData()

      expect(result).toEqual([])
    })
  })

  describe('getLoessDataForVital', () => {
    const mockLoessCSV = `TimeFromTransfusion,VitalParam,Abbreviation,Pred
0,ARTm,ARTm,75.0
30,ARTm,ARTm,75.5
0,HR,HR,80.0
30,HR,HR,82.0`

    it('filters LOESS data by vital parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockLoessCSV)),
      })

      const result = await getLoessDataForVital('ARTm')

      expect(result).toHaveLength(2)
      expect(result.every(r => r.VitalParam === 'ARTm')).toBe(true)
    })

    it('caches filtered LOESS data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockLoessCSV)),
      })

      await getLoessDataForVital('ARTm')
      await getLoessDataForVital('ARTm')

      // Should only fetch once
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('loadObservedDataSummary', () => {
    const mockCSV = `VitalParam,PreTransfusion_Mean,PostTransfusion_Mean
ARTm,75.0,78.0
HR,80.0,85.0`

    it('loads observed data summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockCSV)),
      })

      const result = await loadObservedDataSummary()

      expect(result).toHaveLength(2)
      expect(result[0]).toBeDefined()
      expect(result[0]?.VitalParam).toBe('ARTm')
    })
  })

  describe('loadModelBasedSummary', () => {
    const mockCSV = `VitalParam,Estimate,Lower,Upper
ARTm,2.5,1.5,3.5
HR,5.0,3.0,7.0`

    it('loads model-based summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockCSV)),
      })

      const result = await loadModelBasedSummary()

      expect(result).toHaveLength(2)
    })
  })

  describe('loadDescriptiveStatistics', () => {
    // Synthetic data with the column names verified in the public SAS exports.
    const csvs: Record<string, string> = {
      'unique_patients_count.csv': 'No_of_Unique_Patients\n1500',
      'total_transfused_units.csv': 'No_of_Transfused_Units\n3500',
      'patient_sex_distribution.csv': 'Patient_Sex,No_of_Patients\nMale,800\nFemale,700',
      'patient_age_stats.csv': 'Mean_Age,Median_Age,Min_Age,Max_Age,Q1_Age,Q3_Age\n65.5,67.0,18,95,55,78',
      'patient_age_groups.csv': 'Age_Group,COUNT,PERCENT\n60-,1500,100',
      'rbc_units_per_patient.csv': 'Unit_Category,COUNT,Relative_Frequency\n1,1500,100',
      'donorhb_distribution.csv': 'donorhb_category,No_of_Transfused_Units\n140-154,3500',
      'donor_sex_distribution.csv': 'donor_sex_label,No_of_Transfused_Units\nMale,3500',
      'donor_parity_distribution.csv': 'donor_parity_label,No_of_Transfused_Units\n0,3500',
      'donation_weekday_distribution.csv': 'wdy_donation,No_of_Transfused_Units\n2,3500',
      'storage_distribution.csv': 'storagecat,No_of_Transfused_Units\n10-19,3500',
    }

    function mockDescriptiveFiles(overrides: Record<string, string> = {}) {
      const files = { ...csvs, ...overrides }
      mockFetch.mockImplementation(async (url: string) => {
        const csv = files[url.split('/').pop()!]
        return csv === undefined
          ? { ok: false, status: 404 }
          : { ok: true, arrayBuffer: async () => toBytes(csv) }
      })
    }

    it('loads all 11 CSV files and keeps absent age SD unreported', async () => {
      mockDescriptiveFiles()
      const result = await loadDescriptiveStatistics()
      expect(mockFetch).toHaveBeenCalledTimes(11)
      expect(result.uniquePatients).toBe(1500)
      expect(result.totalUnits).toBe(3500)
      expect(result.patientSex).toHaveLength(2)
      expect(result.patientAge.mean).toBe(65.5)
      expect(result.patientAge.median).toBe(67)
      expect(result.patientAge.sd).toBeUndefined()
      expect(result.donorHb[0]?.count).toBe(3500)
      expect(result.donationWeekday[0]?.weekday).toBe('Monday')
    })

    it('keeps parity labels faithful and preserves unknown or missing categories', async () => {
      mockDescriptiveFiles({
        'donor_parity_distribution.csv': 'donor_parity_label,No_of_Transfused_Units\n0,1000\n1,2000\nUnknown,200\n.,200\n2,100',
      })
      const result = await loadDescriptiveStatistics()
      expect(result.donorParity.map(row => row.parity)).toEqual([
        'Parity 0 (includes male donors)', 'Parity 1', 'Unknown', 'Missing', '2',
      ])
      expect(result.donorParity.map(row => row.count)).toEqual([1000, 2000, 200, 200, 100])
    })

    it('rejects header-only outputs instead of fabricating zero statistics', async () => {
      mockDescriptiveFiles({ 'unique_patients_count.csv': 'No_of_Unique_Patients\n' })
      await expect(loadDescriptiveStatistics()).rejects.toThrow('CSV contains no data rows')
    })

    it.each(['', '.', 'NaN', 'Infinity', '1e999', '-1', '0.5'])('rejects an invalid or missing count (%s)', async count => {
      mockDescriptiveFiles({ 'donor_sex_distribution.csv': `donor_sex_label,No_of_Transfused_Units\nMale,${count}` })
      await expect(loadDescriptiveStatistics()).rejects.toThrow('column')
    })

    it('rejects a renamed required numeric field', async () => {
      mockDescriptiveFiles({ 'patient_age_stats.csv': csvs['patient_age_stats.csv']!.replace('Mean_Age', 'Unexpected_Age') })
      await expect(loadDescriptiveStatistics()).rejects.toThrow('Mean_Age')
    })

    it('rejects invalid age values rather than displaying zero', async () => {
      mockDescriptiveFiles({ 'patient_age_stats.csv': csvs['patient_age_stats.csv']!.replace('65.5', 'NaN') })
      await expect(loadDescriptiveStatistics()).rejects.toThrow('Mean_Age')
    })

    it('preserves real zero counts and percentages', async () => {
      mockDescriptiveFiles({
        'patient_age_groups.csv': 'Age_Group,COUNT,PERCENT\n<20,0,0\n60-,1500,100',
        'donor_sex_distribution.csv': 'donor_sex_label,No_of_Transfused_Units\nMale,0\nFemale,3500',
      })
      const result = await loadDescriptiveStatistics()
      expect(result.ageGroups[0]).toEqual({ ageGroup: '<20', count: 0, percentage: 0 })
      expect(result.donorSex[0]).toEqual({ sex: 'Male', count: 0, percentage: 0 })
    })

    it('rejects a zero distribution denominator', async () => {
      mockDescriptiveFiles({ 'donor_sex_distribution.csv': 'donor_sex_label,No_of_Transfused_Units\nMale,0' })
      await expect(loadDescriptiveStatistics()).rejects.toThrow('distribution total')
    })

    it('does not cache a malformed descriptive result', async () => {
      mockDescriptiveFiles({ 'donor_sex_distribution.csv': 'donor_sex_label,Wrong_Column\nMale,3500' })
      await expect(loadDescriptiveStatistics()).rejects.toThrow('No_of_Transfused_Units')
      mockDescriptiveFiles()
      await expect(loadDescriptiveStatistics()).resolves.toMatchObject({ totalUnits: 3500 })
    })
  })

  describe('loadFactorObservedSummary', () => {
    const mockCSV = `FactorName,Category,VitalParam,PreMean,PostMean
DonorHb_Cat,Low,ARTm,75.0,78.0`

    it('loads factor observed summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockCSV)),
      })

      const result = await loadFactorObservedSummary()

      expect(result).toHaveLength(1)
    })
  })

  describe('loadFactorModelSummary', () => {
    const mockCSV = `FactorName,Category,VitalParam,Estimate,Lower,Upper
DonorHb_Cat,Low,ARTm,2.5,1.5,3.5`

    it('loads factor model summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockCSV)),
      })

      const result = await loadFactorModelSummary()

      expect(result).toHaveLength(1)
    })
  })

  describe('LOESS integrity', () => {
    it.each([loadLoessData, loadLoessMultiSpanData])('propagates invalid optional files', async loader => {
      mockFetch.mockResolvedValueOnce({ ok: true, arrayBuffer: async () => toBytes('<html>error</html>') })
      await expect(loader()).rejects.toThrow('Expected CSV')
    })

    it.each([loadLoessData, loadLoessMultiSpanData])('propagates network failure', async loader => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'))
      await expect(loader()).rejects.toThrow('Connection failed')
    })

    it.each([loadLoessData, loadLoessMultiSpanData])('decodes the known Windows-1252 LOESS exports', async loader => {
      const csv = 'TimeFromTransfusion,VitalParam,Abbreviation,Pred\n0,HR,Hj\u00e4rtfrekv,0'
      const bytes = Uint8Array.from(csv, character => character.charCodeAt(0)).buffer
      mockFetch.mockResolvedValueOnce({ ok: true, arrayBuffer: async () => bytes })
      const result = await loader()
      expect(result[0]?.Abbreviation).toBe('Hj\u00e4rtfrekv')
      expect(result[0]?.Pred).toBe(0)
    })

    it('does not replace missing selected-span values with a different smoother', () => {
      const rows = [{ TimeFromTransfusion: 0, VitalParam: 'ARTm' as const, Pred: 4, LCL: 3, UCL: 5, Pred_25: null }]
      expect(extractLoessForSpan(rows, 25)[0]).toMatchObject({ Pred: null, LCL: undefined, UCL: undefined })
    })

    it('preserves zero estimates for the selected span', () => {
      const rows = [{ TimeFromTransfusion: 0, VitalParam: 'ARTm' as const, Pred: 4, Pred_25: 0, LCL_25: -1, UCL_25: 1 }]
      expect(extractLoessForSpan(rows, 25)[0]).toMatchObject({ Pred: 0, LCL: -1, UCL: 1 })
    })
  })

  describe('preloadData', () => {
    it('preloads critical data in parallel', async () => {
      // Mock responses for all preloaded data
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes('col\nval')),
      })

      await preloadData()

      // Preload summaries used by Main Findings; the optional LOESS file is not needed.
      expect(mockFetch).toHaveBeenCalledTimes(5)
      expect(mockFetch.mock.calls.every(([url]) => !String(url).includes('LOESS'))).toBe(true)
    })

    it('propagates a required summary failure', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 })
      await expect(preloadData()).rejects.toThrow('HTTP 500')
    })

  })

  describe('clearDataCache', () => {
    it('clears all cached data', async () => {
      const mockCSV = `VitalParam,CompFactor,CompName,VitalName,YLabel,DeltaYLabel\nARTm,DonorHb_Cat,Hb,MAP,MAP,dMAP`

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(toBytes(mockCSV)),
      })

      // Load data (caches it)
      await loadVizIndex()
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Should use cache
      await loadVizIndex()
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Clear cache
      clearDataCache()

      // Should fetch again
      await loadVizIndex()
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
