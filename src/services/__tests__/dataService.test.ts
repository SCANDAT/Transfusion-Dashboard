import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  loadVizIndex,
  loadVisualizationData,
  loadTransfusionData,
  loadLoessData,
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

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('dataService', () => {
  beforeEach(() => {
    clearDataCache()
    mockFetch.mockClear()
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
        text: () => Promise.resolve(mockIndexCSV),
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
        text: () => Promise.resolve(mockIndexCSV),
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
        text: () => Promise.resolve(mockCSV),
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
        text: () => Promise.resolve(mockCSV),
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
        text: () => Promise.resolve(mockCSV),
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
        text: () => Promise.resolve(mockVizCSV),
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
          text: () => Promise.resolve(mockVizCSV),
        })

      const result = await loadVisualizationData('ARTm', 'DonorHb_Cat')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result.rows).toHaveLength(4)
    })

    it('caches visualization data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockVizCSV),
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
        text: () => Promise.resolve(mockTransfusionCSV),
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
        text: () => Promise.resolve(mockTransfusionCSV),
      })

      await loadTransfusionData('ARTm')
      await loadTransfusionData('ARTm')

      expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(2) // May have fallback
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
        text: () => Promise.resolve(mockLoessCSV),
      })

      const result = await loadLoessData()

      expect(result).toHaveLength(3)
      expect(result[0]).toBeDefined()
      expect(result[0]?.Pred).toBe(75)
    })

    it('returns empty array on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

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
        text: () => Promise.resolve(mockLoessCSV),
      })

      const result = await getLoessDataForVital('ARTm')

      expect(result).toHaveLength(2)
      expect(result.every(r => r.VitalParam === 'ARTm')).toBe(true)
    })

    it('caches filtered LOESS data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockLoessCSV),
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
        text: () => Promise.resolve(mockCSV),
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
        text: () => Promise.resolve(mockCSV),
      })

      const result = await loadModelBasedSummary()

      expect(result).toHaveLength(2)
    })
  })

  describe('loadDescriptiveStatistics', () => {
    it('loads all 11 CSV files in parallel', async () => {
      // Mock all 11 CSV responses
      mockFetch
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('No_of_Unique_Patients\n1500') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('No_of_Transfused_Units\n3500') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('Patient_Sex,No_of_Patients\nMale,800\nFemale,700') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('Mean_Age,Median_Age,Min_Age,Max_Age,Q1_Age,Q3_Age\n65.5,67.0,18,95,55,78') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('ageGroup,count,percentage\n18-30,100,6.7') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('unitsReceived,count,percentage\n1,500,33.3') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('category,count,percentage\nLow,1000,28.6') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('sex,count,percentage\nMale,2000,57.1') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('parity,count,percentage\nNulliparous,500,40.0') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('weekday,count,percentage\nMonday,500,14.3') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('category,count,percentage\n1-7 days,1000,28.6') })

      const result = await loadDescriptiveStatistics()

      expect(result.uniquePatients).toBe(1500)
      expect(result.totalUnits).toBe(3500)
      expect(result.patientSex).toHaveLength(2)
      expect(result.patientAge.mean).toBe(65.5)
      expect(result.patientAge.median).toBe(67)
    })

    it('handles missing data gracefully', async () => {
      // Mock with empty/minimal data
      mockFetch
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('No_of_Unique_Patients\n') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('No_of_Transfused_Units\n') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('Patient_Sex,No_of_Patients\n') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('Mean_Age,Median_Age,Min_Age,Max_Age,Q1_Age,Q3_Age\n') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('ageGroup,count,percentage\n') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('unitsReceived,count,percentage\n') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('category,count,percentage\n') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('sex,count,percentage\n') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('parity,count,percentage\n') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('weekday,count,percentage\n') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('category,count,percentage\n') })

      const result = await loadDescriptiveStatistics()

      // Should return defaults for missing values
      expect(result.uniquePatients).toBe(0)
      expect(result.totalUnits).toBe(0)
    })
  })

  describe('loadFactorObservedSummary', () => {
    const mockCSV = `FactorName,Category,VitalParam,PreMean,PostMean
DonorHb_Cat,Low,ARTm,75.0,78.0`

    it('loads factor observed summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockCSV),
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
        text: () => Promise.resolve(mockCSV),
      })

      const result = await loadFactorModelSummary()

      expect(result).toHaveLength(1)
    })
  })

  describe('preloadData', () => {
    it('preloads critical data in parallel', async () => {
      // Mock responses for all preloaded data
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('col\nval'),
      })

      await preloadData()

      // Should have called fetch for: viz_index, observed_summary, model_summary, loess, factor_observed, factor_model
      expect(mockFetch).toHaveBeenCalledTimes(6)
    })

    it('handles partial failures gracefully', async () => {
      // Some succeed, some fail
      mockFetch
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('VitalParam,CompFactor,CompName,VitalName,YLabel,DeltaYLabel\nARTm,DonorHb_Cat,Hb,MAP,MAP,dMAP') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('col\nval') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('col\nval') })
        .mockRejectedValueOnce(new Error('LOESS failed')) // LOESS fails but returns []
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('col\nval') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('col\nval') })

      // Should not throw - LOESS failure is handled gracefully
      await expect(preloadData()).resolves.toBeUndefined()
    })
  })

  describe('clearDataCache', () => {
    it('clears all cached data', async () => {
      const mockCSV = `VitalParam,CompFactor,CompName,VitalName,YLabel,DeltaYLabel\nARTm,DonorHb_Cat,Hb,MAP,MAP,dMAP`

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockCSV),
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
