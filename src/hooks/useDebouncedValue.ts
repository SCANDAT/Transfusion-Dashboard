import { useState, useEffect, useRef, useCallback } from 'react'

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

export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)

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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

export function useSliderWithDebounce(
  externalValue: number,
  onCommit: (value: number) => void,
  delay: number = 150
) {
  const [localValue, setLocalValue] = useState(externalValue)
  const isDraggingRef = useRef(false)
  const commitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalValue(externalValue)
    }
  }, [externalValue])

  const handleChange = useCallback((value: number) => {
    isDraggingRef.current = true
    setLocalValue(value)

    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current)
    }

    commitTimeoutRef.current = setTimeout(() => {
      onCommit(value)
    }, delay)
  }, [onCommit, delay])

  const handleChangeEnd = useCallback(() => {
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current)
    }
    isDraggingRef.current = false
    onCommit(localValue)
  }, [localValue, onCommit])

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
