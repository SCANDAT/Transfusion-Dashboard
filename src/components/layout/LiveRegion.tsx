import { useEffect, useState } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'

const TAB_NAMES: Record<string, string> = {
  'main-findings': 'Main Findings',
  'rbc-transfusions': 'RBC Transfusion Effects',
  'component-factor-effects': 'Component Factor Effects',
  'descriptive-statistics': 'Descriptive Statistics',
}

export function LiveRegion() {
  const [announcement, setAnnouncement] = useState('')
  const isLoading = useDashboardStore(state => state.isLoading)
  const error = useDashboardStore(state => state.error)
  const activeTab = useDashboardStore(state => state.activeTab)

  useEffect(() => {
    if (isLoading) {
      setAnnouncement('Loading data...')
    } else if (error) {
      setAnnouncement(`Error: ${error}`)
    } else {
      setAnnouncement('')
    }
  }, [isLoading, error])

  useEffect(() => {
    const tabName = TAB_NAMES[activeTab] || activeTab
    setAnnouncement(`Navigated to ${tabName} tab`)
  }, [activeTab])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  )
}
