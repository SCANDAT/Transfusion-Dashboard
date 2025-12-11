import { useDashboardStore } from '@/stores/dashboardStore'
import type { TabId } from '@/types/store'
import styles from './TabNavigation.module.css'

const TABS: { id: TabId; label: string; shortLabel: string }[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview' },
  { id: 'descriptive-statistics', label: 'Study Population', shortLabel: 'Population' },
  { id: 'main-findings', label: 'Key Results', shortLabel: 'Results' },
  { id: 'rbc-transfusions', label: 'Vital Trajectories', shortLabel: 'Trajectories' },
  { id: 'component-factor-effects', label: 'Component Factors', shortLabel: 'Factors' },
]

export function TabNavigation() {
  const activeTab = useDashboardStore(state => state.activeTab)
  const setActiveTab = useDashboardStore(state => state.setActiveTab)

  return (
    <nav className={styles.nav} role="navigation" aria-label="Dashboard sections">
      <div className={styles.container}>
        <div className={styles.tabList} role="tablist">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                className={`${styles.tab} ${isActive ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.fullLabel}>{tab.label}</span>
                <span className={styles.shortLabel}>{tab.shortLabel}</span>
                {isActive && <span className={styles.activeIndicator} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
