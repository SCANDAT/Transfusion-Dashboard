import { ReactNode } from 'react'
import type { TabId } from '@/types/store'
import styles from './TabPanel.module.css'

interface TabPanelProps {
  tabId: TabId
  isActive: boolean
  children: ReactNode
  className?: string
}

export function TabPanel({ tabId, isActive, children, className }: TabPanelProps) {
  if (!isActive) {
    return null
  }

  return (
    <div
      id={`panel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      tabIndex={0}
      className={`${styles.panel} ${className ?? ""}`}
    >
      {children}
    </div>
  )
}
