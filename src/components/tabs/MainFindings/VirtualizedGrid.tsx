import { useState, useRef, useCallback, useMemo, useEffect, memo } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { VITAL_PARAMS, COMP_FACTORS, VITAL_PARAM_CODES, COMP_FACTOR_CODES } from '@/types'
import type { VizIndexEntry, VitalParamCode, CompFactorCode } from '@/types'
import { SmallMultipleChart } from './SmallMultipleChart'
import styles from './MainFindings.module.css'

interface VirtualizedGridProps {
  vizIndex: VizIndexEntry[]
}

const ROW_HEIGHT = 70 // Height of each row in pixels
const HEADER_HEIGHT = 40 // Height of the header row
const OVERSCAN = 2 // Number of rows to render above/below viewport

// Memoized cell component to prevent re-renders
interface GridCellProps {
  vital: VitalParamCode
  factor: CompFactorCode
  hasEntry: boolean
  isHovered: boolean
  onHover: (cellKey: string | null) => void
  onClick: (vital: VitalParamCode, factor: CompFactorCode) => void
}

const GridCell = memo(function GridCell({
  vital,
  factor,
  hasEntry,
  isHovered,
  onHover,
  onClick,
}: GridCellProps) {
  const cellKey = `${vital}_${factor}`

  const handleMouseEnter = useCallback(() => {
    if (hasEntry) onHover(cellKey)
  }, [hasEntry, onHover, cellKey])

  const handleMouseLeave = useCallback(() => {
    onHover(null)
  }, [onHover])

  const handleClick = useCallback(() => {
    if (hasEntry) onClick(vital, factor)
  }, [hasEntry, onClick, vital, factor])

  return (
    <button
      className={`${styles.gridCell} ${hasEntry ? styles.gridCellActive : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={!hasEntry}
      title={
        hasEntry
          ? `View ${VITAL_PARAMS[vital]?.name} × ${COMP_FACTORS[factor]?.name}`
          : 'No data available'
      }
      style={{ height: ROW_HEIGHT - 4 }}
    >
      {hasEntry && (
        <SmallMultipleChart
          vitalParam={vital}
          compFactor={factor}
          isHovered={isHovered}
        />
      )}
    </button>
  )
})

// Memoized row component
interface GridRowProps {
  vital: VitalParamCode
  factors: CompFactorCode[]
  indexMap: Map<string, VizIndexEntry>
  hoveredCell: string | null
  onHover: (cellKey: string | null) => void
  onClick: (vital: VitalParamCode, factor: CompFactorCode) => void
  style: React.CSSProperties
}

const GridRow = memo(function GridRow({
  vital,
  factors,
  indexMap,
  hoveredCell,
  onHover,
  onClick,
  style,
}: GridRowProps) {
  return (
    <div className={styles.gridRow} style={style}>
      <div className={styles.gridRowHeader}>
        {VITAL_PARAMS[vital]?.shortName || vital}
      </div>
      {factors.map(factor => {
        const cellKey = `${vital}_${factor}`
        return (
          <GridCell
            key={cellKey}
            vital={vital}
            factor={factor}
            hasEntry={indexMap.has(cellKey)}
            isHovered={hoveredCell === cellKey}
            onHover={onHover}
            onClick={onClick}
          />
        )
      })}
    </div>
  )
})

/**
 * VirtualizedGrid - Renders only visible rows for performance
 *
 * For grids with many vital parameters, this component only renders
 * the rows that are currently visible in the viewport, plus a small
 * buffer above and below for smooth scrolling.
 */
export function VirtualizedGrid({ vizIndex }: VirtualizedGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)

  const setActiveTab = useDashboardStore(state => state.setActiveTab)
  const setSelectedVital = useDashboardStore(state => state.setSelectedVital)
  const setSelectedCompFactor = useDashboardStore(state => state.setSelectedCompFactor)

  // Get unique vitals and factors from index, sorted by canonical order
  const vitals = useMemo(() => {
    const available = new Set(vizIndex.map(e => e.VitalParam))
    return VITAL_PARAM_CODES.filter(v => available.has(v))
  }, [vizIndex])

  const factors = useMemo(() => {
    const available = new Set(vizIndex.map(e => e.CompFactor))
    return COMP_FACTOR_CODES.filter(f => available.has(f))
  }, [vizIndex])

  // Create lookup map for O(1) entry checking
  const indexMap = useMemo(() => {
    const map = new Map<string, VizIndexEntry>()
    vizIndex.forEach(entry => {
      map.set(`${entry.VitalParam}_${entry.CompFactor}`, entry)
    })
    return map
  }, [vizIndex])

  // Handle cell click - navigate to detailed view
  const handleCellClick = useCallback((vital: VitalParamCode, factor: CompFactorCode) => {
    setSelectedVital(vital)
    setSelectedCompFactor(factor)
    setActiveTab('component-factor-effects')
  }, [setSelectedVital, setSelectedCompFactor, setActiveTab])

  // Track scroll position and container height for virtualization
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateMetrics = () => {
      setContainerHeight(container.clientHeight)
    }

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    updateMetrics()
    container.addEventListener('scroll', handleScroll, { passive: true })
    const resizeObserver = new ResizeObserver(updateMetrics)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [])

  // Calculate total height to fit all rows
  const totalHeight = vitals.length * ROW_HEIGHT + HEADER_HEIGHT

  // Calculate visible row range with overscan
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor((scrollTop - HEADER_HEIGHT) / ROW_HEIGHT) - OVERSCAN)
    const endIndex = Math.min(
      vitals.length - 1,
      Math.ceil((scrollTop + containerHeight - HEADER_HEIGHT) / ROW_HEIGHT) + OVERSCAN
    )
    return { startIndex, endIndex }
  }, [scrollTop, containerHeight, vitals.length])

  // Only render visible rows
  const visibleVitals = useMemo(() => {
    return vitals.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
  }, [vitals, visibleRange])

  return (
    <div
      ref={containerRef}
      className={styles.virtualContainer}
      style={{
        height: '100%',
        maxHeight: '600px',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Sticky Header */}
        <div
          className={styles.gridHeader}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'var(--color-bg-card)',
          }}
        >
          <div className={styles.gridCorner} />
          {factors.map(factor => (
            <div key={factor} className={styles.gridHeaderCell}>
              {COMP_FACTORS[factor]?.shortName || factor}
            </div>
          ))}
        </div>

        {/* Virtualized Grid rows - only render visible rows */}
        {visibleVitals.map((vital) => {
          const actualIndex = vitals.indexOf(vital)
          const rowTop = HEADER_HEIGHT + actualIndex * ROW_HEIGHT

          return (
            <GridRow
              key={vital}
              vital={vital}
              factors={factors}
              indexMap={indexMap}
              hoveredCell={hoveredCell}
              onHover={setHoveredCell}
              onClick={handleCellClick}
              style={{
                position: 'absolute',
                top: rowTop,
                left: 0,
                right: 0,
                height: ROW_HEIGHT,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
