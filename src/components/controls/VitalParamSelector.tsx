import React from 'react'
import { VITAL_PARAMS } from '@/types/vitals'
import type { VitalParamCode } from '@/types'
import styles from './Controls.module.css'

export interface VitalParamSelectorProps {
  value: VitalParamCode | null
  availableParams: VitalParamCode[]
  onChange: (value: VitalParamCode | null) => void
  label?: string
  id?: string
}

export const VitalParamSelector: React.FC<VitalParamSelectorProps> = ({
  value,
  availableParams,
  onChange,
  label = 'Vital Parameter',
  id = 'vital-param-selector',
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value
    onChange(selectedValue === '' ? null : (selectedValue as VitalParamCode))
  }

  return (
    <div className={styles.controlGroup}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={handleChange}
        className={styles.select}
        aria-label={label}
      >
        <option value="">Select a vital parameter...</option>
        {availableParams.map((param) => (
          <option key={param} value={param}>
            {VITAL_PARAMS[param].name} ({VITAL_PARAMS[param].shortName})
          </option>
        ))}
      </select>
    </div>
  )
}
