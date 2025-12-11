import { useState, useEffect, useCallback, useRef } from 'react'

interface AsyncDataResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Hook for loading async data with proper dependency tracking
 * Uses a stable key derived from dependencies to trigger refetches
 */
export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
): AsyncDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refetchCount, setRefetchCount] = useState(0)

  // Use ref to store the latest fetchFn to avoid stale closures
  const fetchFnRef = useRef(fetchFn)
  fetchFnRef.current = fetchFn

  const refetch = useCallback(() => {
    setRefetchCount(c => c + 1)
  }, [])

  // Create a stable dependency key from the deps array
  const depsKey = JSON.stringify(deps)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchFnRef.current()
      .then(result => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [depsKey, refetchCount])

  return { data, loading, error, refetch }
}
