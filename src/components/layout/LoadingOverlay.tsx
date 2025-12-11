import { useDashboardStore } from '@/stores/dashboardStore'
import styles from './LoadingOverlay.module.css'

export function LoadingOverlay() {
  const isLoading = useDashboardStore(state => state.isLoading)

  if (!isLoading) {
    return null
  }

  return (
    <div
      className={styles.overlay}
      role="alert"
      aria-busy="true"
      aria-label="Loading dashboard data"
    >
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner} aria-hidden="true">
          <svg
            className={styles.spinnerSvg}
            viewBox="0 0 50 50"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className={styles.spinnerCircle}
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="4"
            />
          </svg>
        </div>
        <p className={styles.loadingText}>Loading dashboard data...</p>
      </div>
    </div>
  )
}
