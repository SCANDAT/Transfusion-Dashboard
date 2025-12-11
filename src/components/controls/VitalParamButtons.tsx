import React from 'react'
import { VITAL_PARAMS } from '@/types/vitals'
import type { VitalParamCode } from '@/types'
import styles from './Controls.module.css'

export interface VitalParamButtonsProps {
  availableParams: VitalParamCode[]
  selectedParams: VitalParamCode[]
  onToggle: (param: VitalParamCode) => void
}

export const VitalParamButtons: React.FC<VitalParamButtonsProps> = ({
  availableParams,
  selectedParams,
  onToggle,
}) => {
  const isSelected = (param: VitalParamCode) => selectedParams.includes(param)

  const handleToggle = (param: VitalParamCode) => {
    onToggle(param)
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    param: VitalParamCode
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle(param)
    }
  }

  return (
    <div className={styles.controlGroup}>
      <label className={styles.label}>Vital Parameters</label>
      <div
        className={styles.toggleBtnGroup}
        role="group"
        aria-label="Vital parameters selection"
      >
        {availableParams.map((param) => {
          const selected = isSelected(param)
          const paramInfo = VITAL_PARAMS[param]

          return (
            <button
              key={param}
              onClick={() => handleToggle(param)}
              onKeyDown={(e) => handleKeyDown(e, param)}
              className={`${styles.toggleBtn} ${selected ? styles.toggleBtnActive : ''}`}
              role="checkbox"
              aria-checked={selected}
              aria-label={paramInfo.name}
              title={paramInfo.name}
            >
              <span className={styles.toggleBtnText}>{paramInfo.shortName}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
