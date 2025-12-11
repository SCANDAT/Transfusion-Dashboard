import { useEffect, useCallback, useState, useRef } from 'react'
import { useDashboardStore, useComponentFactorEffectsState, useComponentFactorEffectsActions } from '@/stores/dashboardStore'
import {
  loadVisualizationData,
  getAvailableVitalParams,
  getAvailableCompFactors,
} from '@/services/dataService'
import { useAsyncData } from '@/hooks/useCSVData'
import { EffectCharts } from './EffectCharts'
import { VITAL_PARAMS, COMP_FACTORS } from '@/types'
import type { VitalParamCode, CompFactorCode } from '@/types'
import styles from './ComponentFactorEffects.module.css'

// Time range constants
const TIME_MIN = -720
const TIME_MAX = 720

export function ComponentFactorEffectsTab() {
  // Use optimized selectors - only re-renders when relevant state changes
  const {
    selectedVital,
    selectedCompFactor,
    selectedComparisons,
    timeRange,
    displayOptions,
    visualizationData,
    availableVitals,
    availableCompFactors,
  } = useComponentFactorEffectsState()

  const {
    setSelectedVital,
    setSelectedCompFactor,
    toggleComparison,
    selectAllComparisons,
    setTimeRange,
    setDisplayOption,
    setVisualizationData,
    setAvailableVitals,
    setAvailableCompFactors,
    setError,
  } = useComponentFactorEffectsActions()

  const setLoading = useDashboardStore((state) => state.setLoading)

  // Local state for time range inputs
  const [localTimeMin, setLocalTimeMin] = useState(timeRange[0])
  const [localTimeMax, setLocalTimeMax] = useState(timeRange[1])
  const [isEditingMin, setIsEditingMin] = useState(false)
  const [isEditingMax, setIsEditingMax] = useState(false)
  const isDraggingRef = useRef(false)

  // Load available vitals on mount
  const { data: vitals } = useAsyncData(getAvailableVitalParams, [])

  useEffect(() => {
    if (vitals && vitals.length > 0) {
      setAvailableVitals(vitals)
    }
  }, [vitals, setAvailableVitals])

  // Load available factors when vital changes, auto-select Donor Hemoglobin
  useEffect(() => {
    if (selectedVital) {
      getAvailableCompFactors(selectedVital)
        .then(factors => {
          setAvailableCompFactors(factors)
          // Auto-select Donor Hemoglobin if available and no factor currently selected
          if (!selectedCompFactor && factors.includes('DonorHb_Cat')) {
            setSelectedCompFactor('DonorHb_Cat')
          } else if (!selectedCompFactor && factors.length > 0 && factors[0]) {
            // Fallback to first factor if DonorHb_Cat not available
            setSelectedCompFactor(factors[0])
          }
        })
        .catch(err => {
          const message = err instanceof Error ? err.message : String(err)
          setError(message)
        })
    }
  }, [selectedVital, selectedCompFactor, setAvailableCompFactors, setSelectedCompFactor, setError])

  // Load visualization data when vital + factor selected
  useEffect(() => {
    if (selectedVital && selectedCompFactor) {
      let cancelled = false
      setLoading(true)
      loadVisualizationData(selectedVital, selectedCompFactor)
        .then(data => {
          if (cancelled) return
          setVisualizationData(data)
          // Auto-select all comparisons
          if (data.comparisonValues.length > 0) {
            selectAllComparisons(data.comparisonValues)
          }
        })
        .catch(err => {
          if (cancelled) return
          const message = err instanceof Error ? err.message : String(err)
          setError(message)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })

      return () => {
        cancelled = true
      }
    }
  }, [selectedVital, selectedCompFactor, setVisualizationData, selectAllComparisons, setLoading, setError])

  // Sync local time state with global state
  useEffect(() => {
    if (!isDraggingRef.current && !isEditingMin && !isEditingMax) {
      setLocalTimeMin(timeRange[0])
      setLocalTimeMax(timeRange[1])
    }
  }, [timeRange, isEditingMin, isEditingMax])

  const handleVitalChange = useCallback((vital: VitalParamCode) => {
    setSelectedVital(vital)
  }, [setSelectedVital])

  const handleFactorChange = useCallback((factor: CompFactorCode) => {
    setSelectedCompFactor(factor)
  }, [setSelectedCompFactor])

  const handleSelectAll = useCallback(() => {
    if (visualizationData) {
      selectAllComparisons(visualizationData.comparisonValues)
    }
  }, [visualizationData, selectAllComparisons])

  const handleDeselectAll = useCallback(() => {
    selectAllComparisons([])
  }, [selectAllComparisons])

  // Time range handlers
  const handleMinSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    isDraggingRef.current = true
    const value = Number(e.target.value)
    if (value < localTimeMax) {
      setLocalTimeMin(value)
    }
  }, [localTimeMax])

  const handleMaxSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    isDraggingRef.current = true
    const value = Number(e.target.value)
    if (value > localTimeMin) {
      setLocalTimeMax(value)
    }
  }, [localTimeMin])

  const handleSliderCommit = useCallback(() => {
    isDraggingRef.current = false
    setTimeRange([localTimeMin, localTimeMax])
  }, [localTimeMin, localTimeMax, setTimeRange])

  const handleTimeMinInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? TIME_MIN : Number(e.target.value)
    setLocalTimeMin(value)
  }, [])

  const handleTimeMaxInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? TIME_MAX : Number(e.target.value)
    setLocalTimeMax(value)
  }, [])

  const commitTimeRange = useCallback(() => {
    setIsEditingMin(false)
    setIsEditingMax(false)
    const min = Math.max(TIME_MIN, Math.min(localTimeMin, localTimeMax - 1))
    const max = Math.min(TIME_MAX, Math.max(localTimeMax, min + 1))
    setLocalTimeMin(min)
    setLocalTimeMax(max)
    setTimeRange([min, max])
  }, [localTimeMin, localTimeMax, setTimeRange])

  // Get category label for comparison values
  const getCategoryLabel = (factor: CompFactorCode, value: string | number): string => {
    const labels: Record<string, Record<string, string>> = {
      DonorHb_Cat: { '1': '<125', '2': '125-139', '3': '140-154', '4': '155-169', '5': '≥170' },
      Storage_Cat: { '1': '<10d', '2': '10-19d', '3': '20-29d', '4': '30-39d', '5': '≥40d' },
      DonorSex: { '1': 'Male', '2': 'Female' },
      DonorParity: { '0': 'Nulliparous', '1': 'Parous' },
      wdy_donation: { '1': 'Sun', '2': 'Mon', '3': 'Tue', '4': 'Wed', '5': 'Thu', '6': 'Fri', '7': 'Sat' },
    }
    return labels[factor]?.[String(value)] || String(value)
  }

  return (
    <div className={styles.container}>
      {/* Compact Toolbar */}
      <div className={styles.toolbar}>
        {/* Vital Parameters */}
        <div className={styles.toolbarSection}>
          <span className={styles.toolbarLabel}>Vital</span>
          <div className={styles.pillGroup}>
            {availableVitals.map((param) => {
              const isSelected = selectedVital === param
              const paramInfo = VITAL_PARAMS[param]
              return (
                <button
                  key={param}
                  className={`${styles.pill} ${isSelected ? styles.active : ''}`}
                  onClick={() => handleVitalChange(param)}
                  title={paramInfo.name}
                >
                  {paramInfo.shortName}
                </button>
              )
            })}
          </div>
        </div>

        {/* Component Factors */}
        <div className={styles.toolbarSection}>
          <span className={styles.toolbarLabel}>Factor</span>
          <div className={styles.pillGroup}>
            {availableCompFactors.map((factor) => {
              const isSelected = selectedCompFactor === factor
              const factorInfo = COMP_FACTORS[factor]
              return (
                <button
                  key={factor}
                  className={`${styles.pill} ${isSelected ? styles.active : ''}`}
                  onClick={() => handleFactorChange(factor)}
                  disabled={!selectedVital}
                  title={factorInfo.name}
                >
                  {factorInfo.shortName}
                </button>
              )
            })}
          </div>
        </div>

        {/* Comparison Categories */}
        {visualizationData && selectedCompFactor && (
          <div className={styles.toolbarSection}>
            <span className={styles.toolbarLabel}>Compare</span>
            <div className={styles.pillGroup}>
              {visualizationData.comparisonValues.map((value) => {
                const isSelected = selectedComparisons.includes(value)
                return (
                  <button
                    key={String(value)}
                    className={`${styles.pill} ${styles.categoryPill} ${isSelected ? styles.active : ''}`}
                    onClick={() => toggleComparison(value)}
                  >
                    {getCategoryLabel(selectedCompFactor, value)}
                  </button>
                )
              })}
              <button className={styles.miniBtn} onClick={handleSelectAll} title="Select all">
                All
              </button>
              <button className={styles.miniBtn} onClick={handleDeselectAll} title="Clear all">
                None
              </button>
            </div>
          </div>
        )}

        {/* Time Range */}
        <div className={styles.toolbarSection}>
          <span className={styles.toolbarLabel}>Time (min)</span>
          <div className={styles.timeRangeControl}>
            <input
              type="number"
              className={styles.timeInput}
              value={localTimeMin}
              onChange={handleTimeMinInputChange}
              onFocus={() => setIsEditingMin(true)}
              onBlur={commitTimeRange}
              onKeyDown={(e) => e.key === 'Enter' && commitTimeRange()}
              min={TIME_MIN}
              max={TIME_MAX}
            />
            <div className={styles.dualRangeSlider}>
              <div className={styles.sliderTrack} />
              <div
                className={styles.sliderRange}
                style={{
                  left: `${((localTimeMin - TIME_MIN) / (TIME_MAX - TIME_MIN)) * 100}%`,
                  right: `${100 - ((localTimeMax - TIME_MIN) / (TIME_MAX - TIME_MIN)) * 100}%`,
                }}
              />
              <input
                type="range"
                className={styles.dualSliderInput}
                min={TIME_MIN}
                max={TIME_MAX}
                step={10}
                value={localTimeMin}
                onChange={handleMinSliderChange}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
              />
              <input
                type="range"
                className={styles.dualSliderInput}
                min={TIME_MIN}
                max={TIME_MAX}
                step={10}
                value={localTimeMax}
                onChange={handleMaxSliderChange}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
              />
            </div>
            <input
              type="number"
              className={styles.timeInput}
              value={localTimeMax}
              onChange={handleTimeMaxInputChange}
              onFocus={() => setIsEditingMax(true)}
              onBlur={commitTimeRange}
              onKeyDown={(e) => e.key === 'Enter' && commitTimeRange()}
              min={TIME_MIN}
              max={TIME_MAX}
            />
          </div>
        </div>

        {/* Model Mode Toggle */}
        <div className={styles.toolbarSection}>
          <span className={styles.toolbarLabel}>Model</span>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeToggleBtn} ${!displayOptions.showDeltaPlot ? styles.active : ''}`}
              onClick={() => setDisplayOption('showDeltaPlot', false)}
            >
              Absolute
            </button>
            <button
              className={`${styles.modeToggleBtn} ${displayOptions.showDeltaPlot ? styles.active : ''}`}
              onClick={() => setDisplayOption('showDeltaPlot', true)}
            >
              Relative
            </button>
          </div>
        </div>

        {/* Display Options */}
        <div className={styles.toolbarSection}>
          <span className={styles.toolbarLabel}>Show</span>
          <div className={styles.displayToggles}>
            <label className={styles.toggleOption}>
              <input
                type="checkbox"
                className={styles.toggleCheckbox}
                checked={displayOptions.showConfidenceInterval}
                onChange={(e) => setDisplayOption('showConfidenceInterval', e.target.checked)}
              />
              <span className={styles.toggleText}>CI</span>
            </label>
            <label className={styles.toggleOption}>
              <input
                type="checkbox"
                className={styles.toggleCheckbox}
                checked={displayOptions.showBaseModel}
                onChange={(e) => setDisplayOption('showBaseModel', e.target.checked)}
              />
              <span className={styles.toggleText}>Base</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className={styles.main}>
        {!selectedVital ? (
          <div className={styles.placeholder}>
            Select a vital parameter to begin exploring component factor effects
          </div>
        ) : !selectedCompFactor ? (
          <div className={styles.placeholder}>
            Select a component factor to compare categories
          </div>
        ) : !visualizationData ? (
          <div className={styles.placeholder}>
            <div className={styles.loadingSpinner}></div>
            Loading...
          </div>
        ) : selectedComparisons.length === 0 ? (
          <div className={styles.placeholder}>
            Select comparison groups using the pills above
          </div>
        ) : (
          <EffectCharts
            data={visualizationData}
            selectedComparisons={selectedComparisons}
            timeRange={timeRange}
            displayOptions={displayOptions}
          />
        )}
      </div>
    </div>
  )
}
