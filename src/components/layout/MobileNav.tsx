import { useState, useEffect, useRef } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'
import type { TabId } from '@/types/store'
import styles from './MobileNav.module.css'

const TABS: { id: TabId; label: string }[] = [
  { id: 'main-findings', label: 'Main Findings' },
  { id: 'rbc-transfusions', label: 'RBC Transfusion Effects' },
  { id: 'component-factor-effects', label: 'Component Factor Effects' },
  { id: 'descriptive-statistics', label: 'Descriptive Statistics' },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const activeTab = useDashboardStore(state => state.activeTab)
  const setActiveTab = useDashboardStore(state => state.setActiveTab)

  const currentTabLabel = TABS.find(t => t.id === activeTab)?.label || 'Select Tab'

  const handleTabSelect = (tabId: TabId) => {
    setActiveTab(tabId)
    setIsOpen(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <div className={styles.mobileNav}>
      <button
        ref={buttonRef}
        className={styles.menuButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label="Toggle navigation menu"
      >
        <span className={styles.menuIcon} aria-hidden="true">
          {isOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </span>
        <span className={styles.currentTab}>{currentTabLabel}</span>
        <span className={styles.chevron} aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <path fillRule="evenodd" d="M4.293 5.293a1 1 0 011.414 0L8 7.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <nav
          ref={menuRef}
          id="mobile-menu"
          className={styles.menu}
          role="navigation"
          aria-label="Mobile navigation"
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.menuItem} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => handleTabSelect(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
