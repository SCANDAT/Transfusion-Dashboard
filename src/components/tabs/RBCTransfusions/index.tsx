import { useEffect, useMemo, memo, useCallback, useState, useRef } from 'react'
import { useTransfusionState, useTransfusionActions } from '@/stores/dashboardStore'
import { loadTransfusionData, loadLoessMultiSpanData, getAvailableVitalParams, extractLoessForSpan, type LoessSpanValue } from '@/services/dataService'
import { useAsyncData } from '@/hooks/useCSVData'
import { VITAL_PARAMS } from '@/types/vitals'
import { PlotPair } from './PlotPair'
import type { VitalParamCode, LoessMultiSpanRow } from '@/types'
import styles from './RBCTransfusions.module.css'

// Time range constants
const TIME_MIN = -720
const TIME_MAX = 720

export function RBCTransfusionsTab() {
  // Use optimized selectors - only re-renders when relevant state changes
  const {
    transfusionSelectedVitals,
    transfusionTimeRange,
    transfusionDisplayOptions,
    availableVitals,
  } = useTransfusionState()

  const {
    toggleTransfusionVital,
    setTransfusionTimeRange,
    setTransfusionDisplayOption,
    setAvailableVitals,
    setError,
  } = useTransfusionActions()

  // Local state for LOESS smoothing span (10-90, default 25 for moderate smoothing)
  const [loessSpan, setLoessSpan] = useState<LoessSpanValue>(25)

  // Local state for model chart mode (absolute vs relative)
  const [modelMode, setModelMode] = useState<'absolute' | 'relative'>('absolute')

  // Local state for which charts to display
  const [chartDisplay, setChartDisplay] = useState<'both' | 'loess' | 'model'>('both')

  // Local state for time range inputs (for manual text editing)
  const [localTimeMin, setLocalTimeMin] = useState(transfusionTimeRange[0])
  const [localTimeMax, setLocalTimeMax] = useState(transfusionTimeRange[1])
  const [isEditingMin, setIsEditingMin] = useState(false)
  const [isEditingMax, setIsEditingMax] = useState(false)
  const isDraggingRef = useRef(false)

  // Load available vitals on mount
  const { data: vitals, error: vitalsError } = useAsyncData(getAvailableVitalParams, [])

  useEffect(() => {
    if (vitals && vitals.length > 0) {
      setAvailableVitals(vitals)
      // Auto-select first vital if none selected
      if (transfusionSelectedVitals.length === 0) {
        toggleTransfusionVital(vitals[0] as VitalParamCode)
      }
    }
  }, [vitals, setAvailableVitals, transfusionSelectedVitals.length, toggleTransfusionVital])

  // Load multi-span LOESS data once at tab level (optimization: avoid loading per-vital)
  const { data: allLoessMultiSpanData } = useAsyncData(loadLoessMultiSpanData, [])

  useEffect(() => {
    if (vitalsError) {
      setError(vitalsError.message)
    }
  }, [vitalsError, setError])

  // Sync local time state with global state (only when not dragging/editing)
  useEffect(() => {
    if (!isDraggingRef.current && !isEditingMin && !isEditingMax) {
      setLocalTimeMin(transfusionTimeRange[0])
      setLocalTimeMax(transfusionTimeRange[1])
    }
  }, [transfusionTimeRange, isEditingMin, isEditingMax])

  // Memoize toggle handler
  const handleToggle = useCallback((param: VitalParamCode) => {
    toggleTransfusionVital(param)
  }, [toggleTransfusionVital])

  // Handle slider changes (immediate feedback)
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

  // Commit slider changes on mouse up
  const handleSliderCommit = useCallback(() => {
    isDraggingRef.current = false
    setTransfusionTimeRange([localTimeMin, localTimeMax])
  }, [localTimeMin, localTimeMax, setTransfusionTimeRange])

  // Handle text input changes
  const handleTimeMinInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? TIME_MIN : Number(e.target.value)
    setLocalTimeMin(value)
  }, [])

  const handleTimeMaxInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? TIME_MAX : Number(e.target.value)
    setLocalTimeMax(value)
  }, [])

  // Commit text input changes
  const commitTimeRange = useCallback(() => {
    setIsEditingMin(false)
    setIsEditingMax(false)
    const min = Math.max(TIME_MIN, Math.min(localTimeMin, localTimeMax - 1))
    const max = Math.min(TIME_MAX, Math.max(localTimeMax, min + 1))
    setLocalTimeMin(min)
    setLocalTimeMax(max)
    setTransfusionTimeRange([min, max])
  }, [localTimeMin, localTimeMax, setTransfusionTimeRange])

  return (
    <div className={styles.container}>
      {/* Compact Toolbar */}
      <div className={styles.toolbar}>
        {/* Vital Parameters */}
        <div className={styles.toolbarSection}>
          <span className={styles.toolbarLabel}>Vitals</span>
          <div className={styles.vitalPills}>
            {availableVitals.map((param) => {
              const isSelected = transfusionSelectedVitals.includes(param)
              const paramInfo = VITAL_PARAMS[param]
              return (
                <button
                  key={param}
                  className={`${styles.vitalPill} ${isSelected ? styles.active : ''}`}
                  onClick={() => handleToggle(param)}
                  title={paramInfo.name}
                >
                  {paramInfo.shortName}
                </button>
              )
            })}
          </div>
        </div>

        {/* Chart Display Toggle */}
        <div className={styles.toolbarSection}>
          <span className={styles.toolbarLabel}>Display</span>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeToggleBtn} ${chartDisplay === 'both' ? styles.active : ''}`}
              onClick={() => setChartDisplay('both')}
            >
              Both
            </button>
            <button
              className={`${styles.modeToggleBtn} ${chartDisplay === 'loess' ? styles.active : ''}`}
              onClick={() => setChartDisplay('loess')}
            >
              LOESS
            </button>
            <button
              className={`${styles.modeToggleBtn} ${chartDisplay === 'model' ? styles.active : ''}`}
              onClick={() => setChartDisplay('model')}
            >
              Model
            </button>
          </div>
        </div>

        {/* LOESS Smoothing - only show when LOESS is displayed */}
        {chartDisplay !== 'model' && (
          <div className={styles.toolbarSection}>
            <span className={styles.toolbarLabel}>LOESS</span>
            <div className={styles.loessControl}>
              <input
                type="range"
                className={styles.loessSlider}
                min={10}
                max={90}
                step={1}
                value={loessSpan}
                onChange={(e) => setLoessSpan(Number(e.target.value) as LoessSpanValue)}
              />
              <span className={styles.loessValue}>{(loessSpan / 100).toFixed(2)}</span>
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

        {/* Model Mode Toggle - only show when Model is displayed */}
        {chartDisplay !== 'loess' && (
          <div className={styles.toolbarSection}>
            <span className={styles.toolbarLabel}>Model</span>
            <div className={styles.modeToggle}>
              <button
                className={`${styles.modeToggleBtn} ${modelMode === 'absolute' ? styles.active : ''}`}
                onClick={() => setModelMode('absolute')}
              >
                Absolute
              </button>
              <button
                className={`${styles.modeToggleBtn} ${modelMode === 'relative' ? styles.active : ''}`}
                onClick={() => setModelMode('relative')}
              >
                Relative
              </button>
            </div>
          </div>
        )}

        {/* Display Options */}
        <div className={styles.toolbarSection}>
          <span className={styles.toolbarLabel}>Show</span>
          <div className={styles.displayToggles}>
            <label className={styles.toggleOption}>
              <input
                type="checkbox"
                className={styles.toggleCheckbox}
                checked={transfusionDisplayOptions.showConfidenceInterval}
                onChange={(e) => setTransfusionDisplayOption('showConfidenceInterval', e.target.checked)}
              />
              <span className={styles.toggleText}>CI</span>
            </label>
            <label className={styles.toggleOption}>
              <input
                type="checkbox"
                className={styles.toggleCheckbox}
                checked={transfusionDisplayOptions.showBaseModel}
                onChange={(e) => setTransfusionDisplayOption('showBaseModel', e.target.checked)}
              />
              <span className={styles.toggleText}>Base Model</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className={styles.main}>
        {transfusionSelectedVitals.length === 0 ? (
          <div className={styles.placeholder}>
            Select one or more vital parameters to view transfusion effects
          </div>
        ) : (
          <div
            className={`${styles.plotGrid} ${chartDisplay !== 'both' ? styles.singleChart : ''}`}
            data-cols={getGridCols(transfusionSelectedVitals.length)}
          >
            {transfusionSelectedVitals.map((vital) => (
              <TransfusionPlotPair
                key={vital}
                vitalParam={vital}
                timeRange={transfusionTimeRange}
                displayOptions={transfusionDisplayOptions}
                allLoessData={allLoessMultiSpanData}
                loessSpan={loessSpan}
                modelMode={modelMode}
                chartDisplay={chartDisplay}
                useFlexibleHeight={transfusionSelectedVitals.length >= 3}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Grid layout: 1 col for 1-2 items, 2 cols for 3+ items
function getGridCols(count: number): number {
  if (count <= 2) return 1
  return 2
}

interface TransfusionPlotPairProps {
  vitalParam: VitalParamCode
  timeRange: [number, number]
  displayOptions: {
    showConfidenceInterval: boolean
    showBaseModel: boolean
    showDeltaPlot: boolean
  }
  allLoessData: LoessMultiSpanRow[] | null
  loessSpan: LoessSpanValue
  modelMode: 'absolute' | 'relative'
  chartDisplay: 'both' | 'loess' | 'model'
  useFlexibleHeight: boolean
}

// Memoize to prevent re-renders when parent state changes but props are same
const TransfusionPlotPair = memo(function TransfusionPlotPair({
  vitalParam,
  timeRange,
  displayOptions,
  allLoessData,
  loessSpan,
  modelMode,
  chartDisplay,
  useFlexibleHeight,
}: TransfusionPlotPairProps) {
  const { data: transfusionData, loading: loadingTrans } = useAsyncData(
    () => loadTransfusionData(vitalParam),
    [vitalParam]
  )

  // Filter and extract LOESS data for the selected vital and span
  const loessData = useMemo(() => {
    if (!allLoessData) return []
    // First filter by vital parameter (case-insensitive comparison)
    const vitalParamLower = vitalParam.toLowerCase()
    const filteredForVital = allLoessData.filter(
      row => row.VitalParam?.toLowerCase() === vitalParamLower ||
             row.Abbreviation?.toLowerCase() === vitalParamLower
    )
    // Then extract the selected span's prediction values
    return extractLoessForSpan(filteredForVital, loessSpan)
  }, [allLoessData, vitalParam, loessSpan])

  if (loadingTrans || !allLoessData) {
    return <div className={styles.loadingPlot}>Loading {vitalParam}...</div>
  }

  if (!transfusionData) {
    return <div className={styles.errorPlot}>Failed to load {vitalParam}</div>
  }

  return (
    <PlotPair
      vitalParam={vitalParam}
      transfusionData={transfusionData}
      loessData={loessData}
      timeRange={timeRange}
      displayOptions={displayOptions}
      modelMode={modelMode}
      chartDisplay={chartDisplay}
      useFlexibleHeight={useFlexibleHeight}
    />
  )
})
