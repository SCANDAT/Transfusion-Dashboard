import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * A hook that returns a debounced version of the value.
 * The debounced value will only update after the specified delay
 * has passed without the value changing.
 *
 * @param value The value to debounce
 * @param delay The debounce delay in milliseconds
 * @returns The debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * A hook that returns a debounced callback function.
 * The callback will only be executed after the specified delay
 * has passed without it being called again.
 *
 * @param callback The callback to debounce
 * @param delay The debounce delay in milliseconds
 * @returns A debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  ) as T

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * A hook for managing slider state with debounced commits to a store.
 * Provides immediate visual feedback while debouncing the actual state updates.
 *
 * @param externalValue The value from external state (e.g., zustand store)
 * @param onCommit Callback to commit the value to external state
 * @param delay Debounce delay in milliseconds (default: 150ms)
 */
export function useSliderWithDebounce(
  externalValue: number,
  onCommit: (value: number) => void,
  delay: number = 150
) {
  const [localValue, setLocalValue] = useState(externalValue)
  const isDraggingRef = useRef(false)
  const commitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local value with external value when not dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalValue(externalValue)
    }
  }, [externalValue])

  const handleChange = useCallback((value: number) => {
    isDraggingRef.current = true
    setLocalValue(value)

    // Clear any existing timeout
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current)
    }

    // Debounce the commit
    commitTimeoutRef.current = setTimeout(() => {
      onCommit(value)
    }, delay)
  }, [onCommit, delay])

  const handleChangeEnd = useCallback(() => {
    // Immediately commit on drag end
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current)
    }
    isDraggingRef.current = false
    onCommit(localValue)
  }, [localValue, onCommit])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (commitTimeoutRef.current) {
        clearTimeout(commitTimeoutRef.current)
      }
    }
  }, [])

  return {
    value: localValue,
    onChange: handleChange,
    onChangeEnd: handleChangeEnd,
    isDragging: isDraggingRef.current,
  }
}

/**
 * A hook for managing dual range slider state with debounced commits.
 *
 * @param externalMin The min value from external state
 * @param externalMax The max value from external state
 * @param onCommit Callback to commit the range to external state
 * @param delay Debounce delay in milliseconds (default: 150ms)
 */
export function useDualSliderWithDebounce(
  externalMin: number,
  externalMax: number,
  onCommit: (min: number, max: number) => void,
  delay: number = 150
) {
  const [localMin, setLocalMin] = useState(externalMin)
  const [localMax, setLocalMax] = useState(externalMax)
  const isDraggingRef = useRef(false)
  const commitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local values with external values when not dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalMin(externalMin)
      setLocalMax(externalMax)
    }
  }, [externalMin, externalMax])

  const commitValues = useCallback((min: number, max: number) => {
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current)
    }
    commitTimeoutRef.current = setTimeout(() => {
      onCommit(min, max)
    }, delay)
  }, [onCommit, delay])

  const handleMinChange = useCallback((value: number) => {
    isDraggingRef.current = true
    const newMin = Math.min(value, localMax - 1)
    setLocalMin(newMin)
    commitValues(newMin, localMax)
  }, [localMax, commitValues])

  const handleMaxChange = useCallback((value: number) => {
    isDraggingRef.current = true
    const newMax = Math.max(value, localMin + 1)
    setLocalMax(newMax)
    commitValues(localMin, newMax)
  }, [localMin, commitValues])

  const handleChangeEnd = useCallback(() => {
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current)
    }
    isDraggingRef.current = false
    onCommit(localMin, localMax)
  }, [localMin, localMax, onCommit])

  // Cleanup
  useEffect(() => {
    return () => {
      if (commitTimeoutRef.current) {
        clearTimeout(commitTimeoutRef.current)
      }
    }
  }, [])

  return {
    min: localMin,
    max: localMax,
    setMin: setLocalMin,
    setMax: setLocalMax,
    onMinChange: handleMinChange,
    onMaxChange: handleMaxChange,
    onChangeEnd: handleChangeEnd,
  }
}
