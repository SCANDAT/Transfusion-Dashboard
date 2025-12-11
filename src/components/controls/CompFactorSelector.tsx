import React from 'react'
import { COMP_FACTORS } from '@/types/vitals'
import type { CompFactorCode } from '@/types'
import styles from './Controls.module.css'

export interface CompFactorSelectorProps {
  value: CompFactorCode | null
  availableFactors: CompFactorCode[]
  onChange: (value: CompFactorCode | null) => void
  label?: string
  id?: string
  disabled?: boolean
}

export const CompFactorSelector: React.FC<CompFactorSelectorProps> = ({
  value,
  availableFactors,
  onChange,
  label = 'Component Factor',
  id = 'comp-factor-selector',
  disabled = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value
    onChange(selectedValue === '' ? null : (selectedValue as CompFactorCode))
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
        disabled={disabled}
        aria-label={label}
      >
        <option value="">Select a component factor...</option>
        {availableFactors.map((factor) => (
          <option key={factor} value={factor}>
            {COMP_FACTORS[factor].name}
          </option>
        ))}
      </select>
    </div>
  )
}
