# T-008: Control Components

| Field | Value |
|-------|-------|
| **ID** | T-008 |
| **Title** | Control Components |
| **Phase** | 4 - Core Components |
| **Priority** | High |
| **Depends On** | T-002, T-005 |
| **Blocks** | T-009, T-010, T-011, T-012 |
| **Estimated Effort** | 3-4 hours |

---

## Objective

Create reusable control components: dropdowns for vital/factor selection, time range slider, comparison tags, and display option checkboxes.

---

## Requirements

### 1. Vital Parameter Selector

**`src/components/controls/VitalParamSelector.tsx`:**

```typescript
import { VITAL_PARAMS, type VitalParamCode } from '@/types'
import styles from './Controls.module.css'

interface VitalParamSelectorProps {
  value: VitalParamCode | null
  availableParams: VitalParamCode[]
  onChange: (value: VitalParamCode) => void
  label?: string
  id?: string
}

export function VitalParamSelector({
  value,
  availableParams,
  onChange,
  label = 'Vital Parameter',
  id = 'vital-select',
}: VitalParamSelectorProps) {
  return (
    <div className={styles.controlGroup}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <select
        id={id}
        className={styles.select}
        value={value || ''}
        onChange={(e) => onChange(e.target.value as VitalParamCode)}
      >
        <option value="" disabled>Select parameter...</option>
        {availableParams.map(code => (
          <option key={code} value={code}>
            {VITAL_PARAMS[code].name} ({VITAL_PARAMS[code].displayName})
          </option>
        ))}
      </select>
    </div>
  )
}
```

### 2. Component Factor Selector

**`src/components/controls/CompFactorSelector.tsx`:**

```typescript
import { COMP_FACTORS, type CompFactorCode } from '@/types'
import styles from './Controls.module.css'

interface CompFactorSelectorProps {
  value: CompFactorCode | null
  availableFactors: CompFactorCode[]
  onChange: (value: CompFactorCode) => void
  label?: string
  id?: string
  disabled?: boolean
}

export function CompFactorSelector({
  value,
  availableFactors,
  onChange,
  label = 'RBC Component Factor',
  id = 'comp-factor-select',
  disabled = false,
}: CompFactorSelectorProps) {
  return (
    <div className={styles.controlGroup}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <select
        id={id}
        className={styles.select}
        value={value || ''}
        onChange={(e) => onChange(e.target.value as CompFactorCode)}
        disabled={disabled || availableFactors.length === 0}
      >
        <option value="" disabled>Select factor...</option>
        {availableFactors.map(code => (
          <option key={code} value={code}>
            {COMP_FACTORS[code].name}
          </option>
        ))}
      </select>
    </div>
  )
}
```

### 3. Time Range Slider

**`src/components/controls/TimeRangeSlider.tsx`:**

```typescript
import { useState, useCallback } from 'react'
import type { TimeRange } from '@/types'
import styles from './Controls.module.css'

interface TimeRangeSliderProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
  min?: number
  max?: number
  step?: number
  label?: string
}

export function TimeRangeSlider({
  value,
  onChange,
  min = 0,
  max = 720,
  step = 10,
  label = 'Time Range (minutes)',
}: TimeRangeSliderProps) {
  const [localValue, setLocalValue] = useState(value)
  
  const handleMinChange = useCallback((newMin: number) => {
    const newRange: TimeRange = [Math.min(newMin, localValue[1] - step), localValue[1]]
    setLocalValue(newRange)
  }, [localValue, step])
  
  const handleMaxChange = useCallback((newMax: number) => {
    const newRange: TimeRange = [localValue[0], Math.max(newMax, localValue[0] + step)]
    setLocalValue(newRange)
  }, [localValue, step])
  
  const handleCommit = useCallback(() => {
    onChange(localValue)
  }, [localValue, onChange])
  
  const handleReset = useCallback(() => {
    const resetRange: TimeRange = [min, max]
    setLocalValue(resetRange)
    onChange(resetRange)
  }, [min, max, onChange])
  
  return (
    <div className={styles.controlGroup}>
      <div className={styles.labelRow}>
        <label className={styles.label}>{label}</label>
        <button 
          type="button"
          className={styles.resetBtn}
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
      
      <div className={styles.rangeInputs}>
        <div className={styles.rangeField}>
          <label htmlFor="time-min" className={styles.smallLabel}>Min</label>
          <input
            id="time-min"
            type="number"
            className={styles.numberInput}
            value={localValue[0]}
            min={min}
            max={localValue[1] - step}
            step={step}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            onBlur={handleCommit}
          />
        </div>
        
        <span className={styles.rangeSeparator}>to</span>
        
        <div className={styles.rangeField}>
          <label htmlFor="time-max" className={styles.smallLabel}>Max</label>
          <input
            id="time-max"
            type="number"
            className={styles.numberInput}
            value={localValue[1]}
            min={localValue[0] + step}
            max={max}
            step={step}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            onBlur={handleCommit}
          />
        </div>
      </div>
      
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={localValue[1]}
        onChange={(e) => handleMaxChange(Number(e.target.value))}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
      />
    </div>
  )
}
```

### 4. Comparison Tags

**`src/components/controls/ComparisonTags.tsx`:**

```typescript
import { COMP_FACTORS, type CompFactorCode } from '@/types'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import styles from './Controls.module.css'

interface ComparisonTagsProps {
  comparisonColumn: CompFactorCode
  availableValues: (string | number)[]
  selectedValues: (string | number)[]
  onToggle: (value: string | number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

export function ComparisonTags({
  comparisonColumn,
  availableValues,
  selectedValues,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: ComparisonTagsProps) {
  const factorInfo = COMP_FACTORS[comparisonColumn]
  
  const getLabel = (value: string | number): string => {
    const category = factorInfo.categories.find(c => c.value === value)
    return category?.label || String(value)
  }
  
  const allSelected = selectedValues.length === availableValues.length
  
  return (
    <div className={styles.controlGroup}>
      <div className={styles.labelRow}>
        <label className={styles.label}>Comparison Groups</label>
        <button
          type="button"
          className={styles.resetBtn}
          onClick={allSelected ? onDeselectAll : onSelectAll}
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      
      <div className={styles.tagContainer}>
        {availableValues.map((value, index) => {
          const isSelected = selectedValues.includes(value)
          const color = CHART_COLORS[index % CHART_COLORS.length]
          
          return (
            <button
              key={String(value)}
              type="button"
              className={`${styles.tag} ${isSelected ? styles.tagSelected : ''}`}
              style={{
                '--tag-color': color,
                borderColor: isSelected ? color : 'transparent',
              } as React.CSSProperties}
              onClick={() => onToggle(value)}
            >
              <span 
                className={styles.tagDot}
                style={{ backgroundColor: isSelected ? color : 'transparent' }}
              />
              {getLabel(value)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

### 5. Display Options

**`src/components/controls/DisplayOptions.tsx`:**

```typescript
import type { ChartDisplayOptions } from '@/types'
import styles from './Controls.module.css'

interface DisplayOptionsProps {
  options: ChartDisplayOptions
  onChange: <K extends keyof ChartDisplayOptions>(key: K, value: boolean) => void
}

export function DisplayOptions({ options, onChange }: DisplayOptionsProps) {
  return (
    <div className={styles.controlGroup}>
      <label className={styles.label}>Display Options</label>
      
      <div className={styles.checkboxGroup}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={options.showConfidenceInterval}
            onChange={(e) => onChange('showConfidenceInterval', e.target.checked)}
          />
          <span>Show Confidence Interval</span>
        </label>
        
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={options.showBaseModel}
            onChange={(e) => onChange('showBaseModel', e.target.checked)}
          />
          <span>Show Base Model</span>
        </label>
        
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={options.showDeltaPlot}
            onChange={(e) => onChange('showDeltaPlot', e.target.checked)}
          />
          <span>Show Change from Baseline</span>
        </label>
      </div>
    </div>
  )
}
```

### 6. Vital Parameter Toggle Buttons

**`src/components/controls/VitalParamButtons.tsx`:**

```typescript
import { VITAL_PARAMS, type VitalParamCode } from '@/types'
import styles from './Controls.module.css'

interface VitalParamButtonsProps {
  availableParams: VitalParamCode[]
  selectedParams: VitalParamCode[]
  onToggle: (param: VitalParamCode) => void
}

export function VitalParamButtons({
  availableParams,
  selectedParams,
  onToggle,
}: VitalParamButtonsProps) {
  return (
    <div className={styles.controlGroup}>
      <label className={styles.label}>Vital Parameters</label>
      <div className={styles.buttonGroup}>
        {availableParams.map(code => {
          const isSelected = selectedParams.includes(code)
          return (
            <button
              key={code}
              type="button"
              className={`${styles.toggleBtn} ${isSelected ? styles.toggleBtnActive : ''}`}
              onClick={() => onToggle(code)}
            >
              {VITAL_PARAMS[code].displayName}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

### 7. Shared Styles

**`src/components/controls/Controls.module.css`:**

```css
.controlGroup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.labelRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.smallLabel {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.select {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.select:focus {
  outline: none;
  border-color: var(--color-accent-primary);
}

.select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.resetBtn {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--text-xs);
  color: var(--color-accent-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.resetBtn:hover {
  opacity: 0.8;
}

.rangeInputs {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.rangeField {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.rangeSeparator {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.numberInput {
  width: 80px;
  padding: var(--spacing-2);
  font-size: var(--text-sm);
  text-align: center;
  color: var(--color-text-primary);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
}

.slider {
  width: 100%;
  margin-top: var(--spacing-2);
  accent-color: var(--color-accent-primary);
}

.tagContainer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.tag {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-elevated);
  border: 2px solid transparent;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tag:hover {
  background-color: var(--color-bg-hover);
}

.tagSelected {
  color: var(--color-text-primary);
  background-color: var(--color-bg-card);
}

.tagDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid var(--tag-color);
}

.checkboxGroup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.checkbox input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent-primary);
}

.buttonGroup {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.toggleBtn {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggleBtn:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-border-emphasis);
}

.toggleBtnActive {
  color: white;
  background-color: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
}
```

### 8. Index Export

**`src/components/controls/index.ts`:**

```typescript
export { VitalParamSelector } from './VitalParamSelector'
export { CompFactorSelector } from './CompFactorSelector'
export { TimeRangeSlider } from './TimeRangeSlider'
export { ComparisonTags } from './ComparisonTags'
export { DisplayOptions } from './DisplayOptions'
export { VitalParamButtons } from './VitalParamButtons'
```

---

## Acceptance Criteria

- [ ] All dropdowns populate correctly from available options
- [ ] Time range slider commits on blur/release (not every change)
- [ ] Comparison tags show correct colors matching chart colors
- [ ] Select All/Deselect All work correctly
- [ ] Display option checkboxes toggle correctly
- [ ] Vital parameter toggle buttons work (multi-select)
- [ ] All controls are keyboard accessible
- [ ] Disabled states render correctly

---

## Notes for Agent

1. **Controlled Components**: All components are controlled (value + onChange pattern).

2. **Debouncing**: Time range uses local state and commits on blur to prevent excessive re-renders.

3. **Color Sync**: Tag colors must match `CHART_COLORS` array for visual consistency.

4. **CSS Custom Properties**: Use `--tag-color` for dynamic tag colors.

5. **Accessibility**: Labels are associated with inputs via `htmlFor`/`id`.