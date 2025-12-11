import { useEffect, useRef } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'
import styles from './ErrorToast.module.css'

const AUTO_DISMISS_DELAY = 10000 // 10 seconds

export function ErrorToast() {
  const error = useDashboardStore(state => state.error)
  const clearError = useDashboardStore(state => state.clearError)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (error) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new auto-dismiss timeout
      timeoutRef.current = setTimeout(() => {
        clearError()
      }, AUTO_DISMISS_DELAY)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [error, clearError])

  if (!error) {
    return null
  }

  return (
    <div
      className={styles.toastContainer}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className={styles.toast}>
        <div className={styles.toastIcon} aria-hidden="true">
          <AlertIcon />
        </div>

        <div className={styles.toastContent}>
          <h3 className={styles.toastTitle}>Error</h3>
          <p className={styles.toastMessage}>{error}</p>
        </div>

        <button
          onClick={clearError}
          className={styles.toastClose}
          aria-label="Dismiss error message"
          title="Dismiss error"
        >
          <CloseIcon />
        </button>

        <div
          className={styles.progressBar}
          aria-hidden="true"
          style={{ animationDuration: `${AUTO_DISMISS_DELAY}ms` }}
        />
      </div>
    </div>
  )
}

function AlertIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 8V12M12 16H12.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 6L14 14M14 6L6 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
