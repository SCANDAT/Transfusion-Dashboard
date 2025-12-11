import { Component, ReactNode, ErrorInfo } from 'react'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className={styles.errorContainer} role="alert">
          <div className={styles.errorContent}>
            <h2 className={styles.errorTitle}>Something went wrong</h2>
            <p className={styles.errorMessage}>
              {this.state.error?.toString() || 'An unexpected error occurred.'}
            </p>
            {this.state.errorInfo && (
              <details className={styles.errorDetails} open>
                <summary>Component Stack</summary>
                <pre className={styles.errorStack}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className={styles.errorActions}>
              <button
                onClick={this.handleRetry}
                className={styles.retryButton}
                type="button"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className={styles.reloadButton}
                type="button"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
