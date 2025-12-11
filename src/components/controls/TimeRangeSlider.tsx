import React, { useState, useEffect, useRef } from 'react'
import type { TimeRange } from '@/types'
import styles from './Controls.module.css'

export interface TimeRangeSliderProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
  min: number
  max: number
  step?: number
  label?: string
}

export const TimeRangeSlider: React.FC<TimeRangeSliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label = 'Time Range',
}) => {
  // Local state to avoid excessive rerenders
  const [localMin, setLocalMin] = useState(value[0])
  const [localMax, setLocalMax] = useState(value[1])
  const isDraggingRef = useRef(false)

  // Update local state when prop changes
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalMin(value[0])
      setLocalMax(value[1])
    }
  }, [value])

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    isDraggingRef.current = true
    const newMin = Number(event.target.value)
    if (newMin <= localMax) {
      setLocalMin(newMin)
    }
  }

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    isDraggingRef.current = true
    const newMax = Number(event.target.value)
    if (newMax >= localMin) {
      setLocalMax(newMax)
    }
  }

  const commitChanges = () => {
    isDraggingRef.current = false
    if (localMin !== value[0] || localMax !== value[1]) {
      onChange([localMin, localMax])
    }
  }

  const handleMinBlur = () => {
    commitChanges()
  }

  const handleMaxBlur = () => {
    commitChanges()
  }

  const handleMinMouseUp = () => {
    commitChanges()
  }

  const handleMaxMouseUp = () => {
    commitChanges()
  }

  const handleMinKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commitChanges()
    }
  }

  const handleMaxKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commitChanges()
    }
  }

  return (
    <div className={styles.controlGroup}>
      <label className={styles.label}>{label}</label>
      <div className={styles.sliderContainer}>
        <div className={styles.sliderGroup}>
          <label htmlFor="time-range-min" className={styles.sliderLabel}>
            Min: {localMin}
          </label>
          <input
            id="time-range-min"
            type="range"
            min={min}
            max={max}
            step={step}
            value={localMin}
            onChange={handleMinChange}
            onBlur={handleMinBlur}
            onMouseUp={handleMinMouseUp}
            onKeyDown={handleMinKeyDown}
            className={styles.slider}
            aria-label={`${label} minimum value`}
          />
        </div>
        <div className={styles.sliderGroup}>
          <label htmlFor="time-range-max" className={styles.sliderLabel}>
            Max: {localMax}
          </label>
          <input
            id="time-range-max"
            type="range"
            min={min}
            max={max}
            step={step}
            value={localMax}
            onChange={handleMaxChange}
            onBlur={handleMaxBlur}
            onMouseUp={handleMaxMouseUp}
            onKeyDown={handleMaxKeyDown}
            className={styles.slider}
            aria-label={`${label} maximum value`}
          />
        </div>
      </div>
    </div>
  )
}
