import { useEffect, useRef, useCallback } from 'react'

interface PerformanceMetrics {
  componentName: string
  mountTime: number
  renderCount: number
  lastRenderTime: number
  averageRenderTime: number
}

const metricsStore = new Map<string, PerformanceMetrics>()

/**
 * Hook for monitoring component performance
 * Tracks mount time, render counts, and render duration
 *
 * @param componentName - Unique identifier for the component
 * @param enabled - Whether to collect metrics (default: development only)
 */
export function usePerformanceMonitor(
  componentName: string,
  enabled: boolean = import.meta.env.DEV
) {
  const renderStartTime = useRef<number>(performance.now())
  const renderCount = useRef<number>(0)
  const totalRenderTime = useRef<number>(0)
  const mountTime = useRef<number>(0)

  // Track mount time
  useEffect(() => {
    if (!enabled) return

    mountTime.current = performance.now()
    const markName = `${componentName}-mount`

    try {
      performance.mark(markName)
    } catch {
      // Ignore if mark already exists
    }

    return () => {
      // Log lifetime metrics on unmount
      const lifetime = performance.now() - mountTime.current

      if (import.meta.env.DEV) {
        console.debug(`[Performance] ${componentName} unmounted`, {
          lifetime: `${lifetime.toFixed(2)}ms`,
          renders: renderCount.current,
          avgRenderTime: renderCount.current > 0
            ? `${(totalRenderTime.current / renderCount.current).toFixed(2)}ms`
            : 'N/A'
        })
      }

      // Clean up marks
      try {
        performance.clearMarks(markName)
      } catch {
        // Ignore errors
      }
    }
  }, [componentName, enabled])

  // Track each render
  useEffect(() => {
    if (!enabled) return

    const renderTime = performance.now() - renderStartTime.current
    renderCount.current += 1
    totalRenderTime.current += renderTime

    // Update metrics store
    metricsStore.set(componentName, {
      componentName,
      mountTime: mountTime.current,
      renderCount: renderCount.current,
      lastRenderTime: renderTime,
      averageRenderTime: totalRenderTime.current / renderCount.current
    })

    // Reset for next render
    renderStartTime.current = performance.now()
  })

  return {
    getRenderCount: () => renderCount.current,
    getAverageRenderTime: () =>
      renderCount.current > 0 ? totalRenderTime.current / renderCount.current : 0
  }
}

/**
 * Report Web Vitals metrics
 * Should be called once in the app entry point
 */
export function reportWebVitals(onReport?: (metric: WebVitalMetric) => void) {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  // Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry
      const metric: WebVitalMetric = {
        name: 'LCP',
        value: lastEntry.startTime,
        rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
      }

      if (import.meta.env.DEV) {
        console.log(`[Web Vital] LCP: ${lastEntry.startTime.toFixed(2)}ms (${metric.rating})`)
      }
      onReport?.(metric)
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    // LCP not supported
  }

  // First Input Delay
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEventTiming
        const delay = fidEntry.processingStart - fidEntry.startTime
        const metric: WebVitalMetric = {
          name: 'FID',
          value: delay,
          rating: delay < 100 ? 'good' : delay < 300 ? 'needs-improvement' : 'poor'
        }

        if (import.meta.env.DEV) {
          console.log(`[Web Vital] FID: ${delay.toFixed(2)}ms (${metric.rating})`)
        }
        onReport?.(metric)
      })
    })
    fidObserver.observe({ type: 'first-input', buffered: true })
  } catch {
    // FID not supported
  }

  // Cumulative Layout Shift
  try {
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const layoutShift = entry as LayoutShiftEntry
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value
        }
      })

      const metric: WebVitalMetric = {
        name: 'CLS',
        value: clsValue,
        rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
      }

      if (import.meta.env.DEV) {
        console.log(`[Web Vital] CLS: ${clsValue.toFixed(4)} (${metric.rating})`)
      }
      onReport?.(metric)
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  } catch {
    // CLS not supported
  }
}

export interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}

/**
 * Get all collected component metrics
 */
export function getAllMetrics(): PerformanceMetrics[] {
  return Array.from(metricsStore.values())
}

/**
 * Clear all collected metrics
 */
export function clearMetrics(): void {
  metricsStore.clear()
}

/**
 * Hook for measuring async operation duration
 */
export function useAsyncTiming() {
  const timings = useRef<Map<string, number>>(new Map())

  const startTiming = useCallback((label: string) => {
    timings.current.set(label, performance.now())
  }, [])

  const endTiming = useCallback((label: string): number => {
    const start = timings.current.get(label)
    if (start === undefined) {
      console.warn(`[Performance] No start time found for "${label}"`)
      return 0
    }

    const duration = performance.now() - start
    timings.current.delete(label)

    if (import.meta.env.DEV) {
      console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
    }

    return duration
  }, [])

  return { startTiming, endTiming }
}
