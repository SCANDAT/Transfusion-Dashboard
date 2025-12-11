import React from 'react'
import type { ChartDisplayOptions } from '@/types'
import styles from './Controls.module.css'

export interface DisplayOptionsProps {
  options: ChartDisplayOptions
  onChange: <K extends keyof ChartDisplayOptions>(
    key: K,
    value: ChartDisplayOptions[K]
  ) => void
}

export const DisplayOptions: React.FC<DisplayOptionsProps> = ({
  options,
  onChange,
}) => {
  const handleCheckboxChange = (key: keyof ChartDisplayOptions) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(key, event.target.checked)
    }
  }

  return (
    <div className={styles.controlGroup}>
      <label className={styles.label}>Display Options</label>
      <div className={styles.checkboxGroup} role="group" aria-label="Display options">
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            id="show-confidence-interval"
            checked={options.showConfidenceInterval}
            onChange={handleCheckboxChange('showConfidenceInterval')}
            className={styles.checkbox}
            aria-label="Show confidence interval"
          />
          <span className={styles.checkboxText}>Show Confidence Interval</span>
        </label>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            id="show-base-model"
            checked={options.showBaseModel}
            onChange={handleCheckboxChange('showBaseModel')}
            className={styles.checkbox}
            aria-label="Show base model"
          />
          <span className={styles.checkboxText}>Show Base Model</span>
        </label>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            id="show-delta-plot"
            checked={options.showDeltaPlot}
            onChange={handleCheckboxChange('showDeltaPlot')}
            className={styles.checkbox}
            aria-label="Show change from baseline"
          />
          <span className={styles.checkboxText}>Show Change from Baseline</span>
        </label>
      </div>
    </div>
  )
}
