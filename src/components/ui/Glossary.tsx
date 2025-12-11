import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import styles from './Glossary.module.css'

// Glossary definitions for technical terms
// eslint-disable-next-line react-refresh/only-export-components
export const GLOSSARY: Record<string, { term: string; definition: string; category?: string }> = {
  // Statistical Terms
  'loess': {
    term: 'LOESS',
    definition: 'Locally Estimated Scatterplot Smoothing - a method that creates a smooth curve through data points by fitting simple models to localized subsets of the data. It helps reveal underlying trends without assuming a specific mathematical relationship.',
    category: 'Statistics',
  },
  'confidence-interval': {
    term: 'Confidence Interval (CI)',
    definition: 'A range of values that likely contains the true value we\'re trying to estimate. A 95% CI means if we repeated the study many times, 95% of the calculated intervals would contain the true value.',
    category: 'Statistics',
  },
  'mixed-effects-model': {
    term: 'Mixed-Effects Model',
    definition: 'A statistical model that accounts for both fixed effects (factors we\'re interested in studying) and random effects (variations between subjects). This is important when the same patients are measured multiple times.',
    category: 'Statistics',
  },
  'cubic-spline': {
    term: 'Cubic Spline',
    definition: 'A flexible curve-fitting technique that connects data points smoothly. Used here to model how vital signs change over time without assuming a simple straight-line relationship.',
    category: 'Statistics',
  },
  'p-value': {
    term: 'P-value',
    definition: 'The probability of seeing results as extreme as what was observed, if there were truly no effect. A p-value below 0.05 is traditionally considered "statistically significant."',
    category: 'Statistics',
  },
  'standard-error': {
    term: 'Standard Error (SE)',
    definition: 'A measure of the uncertainty in an estimate. Smaller standard errors indicate more precise estimates.',
    category: 'Statistics',
  },

  // Medical Terms
  'rbc': {
    term: 'RBC (Red Blood Cell)',
    definition: 'Red blood cells carry oxygen from the lungs to body tissues. RBC transfusions are given to patients with low blood counts or significant blood loss.',
    category: 'Medical',
  },
  'icu': {
    term: 'ICU (Intensive Care Unit)',
    definition: 'A hospital ward that provides intensive treatment for critically ill patients, with continuous monitoring of vital signs.',
    category: 'Medical',
  },
  'vital-parameters': {
    term: 'Vital Parameters',
    definition: 'Measurements of essential body functions including heart rate, blood pressure, oxygen saturation, and respiratory rate. These are continuously monitored in ICU patients.',
    category: 'Medical',
  },
  'heart-rate': {
    term: 'Heart Rate (HR)',
    definition: 'The number of heartbeats per minute. Normal resting heart rate is typically 60-100 bpm. Higher rates may indicate stress, while lower rates after transfusion may suggest improved oxygen delivery.',
    category: 'Vital Signs',
  },
  'arterial-pressure': {
    term: 'Arterial Blood Pressure',
    definition: 'The pressure of blood against artery walls. Measured as systolic (during heartbeat) over diastolic (between beats). Mean arterial pressure (MAP) is the average pressure during one cardiac cycle.',
    category: 'Vital Signs',
  },
  'spo2': {
    term: 'SpO2 (Oxygen Saturation)',
    definition: 'The percentage of hemoglobin in the blood that is carrying oxygen. Normal levels are typically 95-100%. Measured non-invasively using a pulse oximeter.',
    category: 'Vital Signs',
  },
  'fio2': {
    term: 'FiO2 (Fraction of Inspired Oxygen)',
    definition: 'The concentration of oxygen in the air a patient breathes. Room air is 21% (0.21 FiO2). ICU patients often receive supplemental oxygen, resulting in higher FiO2.',
    category: 'Vital Signs',
  },

  // Component Factors
  'donor-hemoglobin': {
    term: 'Donor Hemoglobin',
    definition: 'The hemoglobin level of the blood donor at the time of donation. Higher donor hemoglobin may result in RBC units with greater oxygen-carrying capacity.',
    category: 'Component Factors',
  },
  'storage-time': {
    term: 'Storage Time',
    definition: 'How long the RBC unit was stored before transfusion. Red blood cells can be stored for up to 42 days. Some studies have investigated whether older blood is less effective.',
    category: 'Component Factors',
  },
  'donor-sex': {
    term: 'Donor Sex',
    definition: 'Whether the blood donor was male or female. Some research has explored whether sex-mismatched transfusions (e.g., female donor to male recipient) have different outcomes.',
    category: 'Component Factors',
  },
  'donor-parity': {
    term: 'Donor Parity',
    definition: 'For female donors, whether they have previously been pregnant (parous) or not (nulliparous). Pregnancy can cause the immune system to develop antibodies that might affect transfusion outcomes.',
    category: 'Component Factors',
  },

  // Study-specific Terms
  'base-model': {
    term: 'Base Model',
    definition: 'Our simpler statistical model that adjusts for time since transfusion, patient age, number of previous transfusions, sex, and which ICU the patient was in.',
    category: 'Study Methods',
  },
  'fully-adjusted-model': {
    term: 'Fully Adjusted Model',
    definition: 'Our comprehensive statistical model that includes all Base Model factors plus adjustments for IV fluids, vasopressor medications, and sedatives given before transfusion.',
    category: 'Study Methods',
  },
  'scandat': {
    term: 'SCANDAT',
    definition: 'Scandinavian Donations and Transfusions - a research database linking blood donation records with recipient health outcomes across Scandinavian countries.',
    category: 'Study Methods',
  },
}

// Context for managing tooltip state
interface GlossaryContextType {
  showTooltip: (term: string, rect: DOMRect) => void
  hideTooltip: () => void
  activeTooltip: { term: string; rect: DOMRect } | null
}

const GlossaryContext = createContext<GlossaryContextType | null>(null)

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [activeTooltip, setActiveTooltip] = useState<{ term: string; rect: DOMRect } | null>(null)

  const showTooltip = useCallback((term: string, rect: DOMRect) => {
    setActiveTooltip({ term, rect })
  }, [])

  const hideTooltip = useCallback(() => {
    setActiveTooltip(null)
  }, [])

  return (
    <GlossaryContext.Provider value={{ showTooltip, hideTooltip, activeTooltip }}>
      {children}
      <GlossaryTooltip />
    </GlossaryContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGlossary() {
  const context = useContext(GlossaryContext)
  if (!context) {
    throw new Error('useGlossary must be used within a GlossaryProvider')
  }
  return context
}

// The floating tooltip component
function GlossaryTooltip() {
  const { activeTooltip, hideTooltip } = useGlossary()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (activeTooltip && tooltipRef.current) {
      const { rect } = activeTooltip
      const tooltip = tooltipRef.current
      const tooltipRect = tooltip.getBoundingClientRect()

      // Calculate position (prefer below the term, centered)
      let top = rect.bottom + 8
      let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2)

      // Adjust if would go off screen
      if (top + tooltipRect.height > window.innerHeight) {
        top = rect.top - tooltipRect.height - 8
      }
      if (left < 8) left = 8
      if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8
      }

      setPosition({ top, left })
    }
  }, [activeTooltip])

  if (!activeTooltip) return null

  const glossaryEntry = GLOSSARY[activeTooltip.term]
  if (!glossaryEntry) return null

  return (
    <div
      ref={tooltipRef}
      className={styles.tooltip}
      style={{ top: position.top, left: position.left }}
      onMouseLeave={hideTooltip}
    >
      <div className={styles.tooltipHeader}>
        <span className={styles.tooltipTerm}>{glossaryEntry.term}</span>
        {glossaryEntry.category && (
          <span className={styles.tooltipCategory}>{glossaryEntry.category}</span>
        )}
      </div>
      <p className={styles.tooltipDefinition}>{glossaryEntry.definition}</p>
    </div>
  )
}

// The inline term component that triggers tooltips
interface GlossaryTermProps {
  termKey: string
  children?: ReactNode
}

export function GlossaryTerm({ termKey, children }: GlossaryTermProps) {
  const { showTooltip, hideTooltip } = useGlossary()
  const termRef = useRef<HTMLSpanElement>(null)

  const handleMouseEnter = () => {
    if (termRef.current) {
      const rect = termRef.current.getBoundingClientRect()
      showTooltip(termKey, rect)
    }
  }

  const glossaryEntry = GLOSSARY[termKey]
  const displayText = children || glossaryEntry?.term || termKey

  return (
    <span
      ref={termRef}
      className={styles.term}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={hideTooltip}
      onFocus={handleMouseEnter}
      onBlur={hideTooltip}
      tabIndex={0}
      role="button"
      aria-describedby={`glossary-${termKey}`}
    >
      {displayText}
      <svg className={styles.termIcon} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </span>
  )
}

// Simple info tooltip for custom explanations (not from glossary)
interface InfoTooltipProps {
  content: string
  children: ReactNode
}

export function InfoTooltip({ content, children }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + (rect.width / 2),
      })
      setIsVisible(true)
    }
  }

  return (
    <span className={styles.infoTrigger}>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </span>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={styles.infoTooltip}
          style={{ top: position.top, left: position.left }}
        >
          {content}
        </div>
      )}
    </span>
  )
}
