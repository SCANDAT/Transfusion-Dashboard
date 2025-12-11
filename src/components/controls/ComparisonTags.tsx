import React, { memo, useCallback, useMemo } from 'react'
import { CHART_COLORS } from '@/types/charts'
import type { CompFactorCode } from '@/types'
import styles from './Controls.module.css'

export interface ComparisonTagsProps {
  comparisonColumn: CompFactorCode
  availableValues: (string | number)[]
  selectedValues: (string | number)[]
  onToggle: (value: string | number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

// Memoized individual tag component to prevent re-renders of all tags when selection changes
interface TagButtonProps {
  value: string | number
  index: number
  selected: boolean
  onToggle: (value: string | number) => void
}

const TagButton = memo(function TagButton({ value, index, selected, onToggle }: TagButtonProps) {
  const colorIndex = index % CHART_COLORS.length
  const color = CHART_COLORS[colorIndex]

  const handleClick = useCallback(() => {
    onToggle(value)
  }, [value, onToggle])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle(value)
    }
  }, [value, onToggle])

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`${styles.tag} ${selected ? styles.tagSelected : ''}`}
      role="checkbox"
      aria-checked={selected}
      aria-label={String(value)}
    >
      <span
        className={styles.tagDot}
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className={styles.tagText}>{String(value)}</span>
    </button>
  )
})

export const ComparisonTags: React.FC<ComparisonTagsProps> = memo(function ComparisonTags({
  comparisonColumn: _comparisonColumn,
  availableValues,
  selectedValues,
  onToggle,
  onSelectAll,
  onDeselectAll,
}) {
  // Use a Set for O(1) lookup instead of array.includes
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues])
  const allSelected = availableValues.length === selectedValues.length
  const noneSelected = selectedValues.length === 0

  const handleSelectAllKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelectAll()
    }
  }, [onSelectAll])

  const handleDeselectAllKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onDeselectAll()
    }
  }, [onDeselectAll])

  return (
    <div className={styles.controlGroup}>
      <div className={styles.tagHeader}>
        <label className={styles.label}>Comparison Groups</label>
        <div className={styles.tagActions}>
          <button
            onClick={onSelectAll}
            onKeyDown={handleSelectAllKeyDown}
            disabled={allSelected}
            className={styles.tagActionBtn}
            aria-label="Select all comparison groups"
          >
            Select All
          </button>
          <button
            onClick={onDeselectAll}
            onKeyDown={handleDeselectAllKeyDown}
            disabled={noneSelected}
            className={styles.tagActionBtn}
            aria-label="Deselect all comparison groups"
          >
            Deselect All
          </button>
        </div>
      </div>
      <div className={styles.tagContainer} role="group" aria-label="Comparison groups">
        {availableValues.map((value, index) => (
          <TagButton
            key={String(value)}
            value={value}
            index={index}
            selected={selectedSet.has(value)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
})
