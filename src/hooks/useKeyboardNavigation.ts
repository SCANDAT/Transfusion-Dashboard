import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  action: () => void
  description?: string
}

export interface UseKeyboardNavigationOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

/**
 * Hook for handling keyboard navigation and shortcuts
 *
 * @example
 * useKeyboardNavigation({
 *   shortcuts: [
 *     { key: '1', action: () => setActiveTab('main-findings'), description: 'Go to Main Findings' },
 *     { key: '2', action: () => setActiveTab('rbc-transfusions'), description: 'Go to RBC Transfusions' },
 *     { key: 't', action: () => toggleTheme(), description: 'Toggle theme' },
 *     { key: 'e', ctrl: true, action: () => exportChart(), description: 'Export chart' },
 *   ]
 * })
 */
export function useKeyboardNavigation({
  shortcuts,
  enabled = true
}: UseKeyboardNavigationOptions) {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Ignore if user is typing in an input, textarea, or contenteditable
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return
    }

    const key = event.key.toLowerCase()

    for (const shortcut of shortcutsRef.current) {
      const keyMatches = shortcut.key.toLowerCase() === key
      const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || event.metaKey)
      const altMatches = !!shortcut.alt === event.altKey
      const shiftMatches = !!shortcut.shift === event.shiftKey
      const metaMatches = shortcut.meta === undefined || shortcut.meta === event.metaKey

      if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
        event.preventDefault()
        shortcut.action()
        return
      }
    }
  }, [enabled])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Hook for arrow key navigation within a list of items
 */
export function useArrowKeyNavigation(
  itemCount: number,
  currentIndex: number,
  onIndexChange: (index: number) => void,
  options?: {
    enabled?: boolean
    wrap?: boolean
    orientation?: 'horizontal' | 'vertical' | 'both'
  }
) {
  const {
    enabled = true,
    wrap = true,
    orientation = 'both'
  } = options ?? {}

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || itemCount === 0) return

    let newIndex = currentIndex

    const isVertical = orientation === 'vertical' || orientation === 'both'
    const isHorizontal = orientation === 'horizontal' || orientation === 'both'

    switch (event.key) {
      case 'ArrowUp':
        if (isVertical) {
          event.preventDefault()
          newIndex = currentIndex - 1
          if (newIndex < 0) {
            newIndex = wrap ? itemCount - 1 : 0
          }
        }
        break
      case 'ArrowDown':
        if (isVertical) {
          event.preventDefault()
          newIndex = currentIndex + 1
          if (newIndex >= itemCount) {
            newIndex = wrap ? 0 : itemCount - 1
          }
        }
        break
      case 'ArrowLeft':
        if (isHorizontal) {
          event.preventDefault()
          newIndex = currentIndex - 1
          if (newIndex < 0) {
            newIndex = wrap ? itemCount - 1 : 0
          }
        }
        break
      case 'ArrowRight':
        if (isHorizontal) {
          event.preventDefault()
          newIndex = currentIndex + 1
          if (newIndex >= itemCount) {
            newIndex = wrap ? 0 : itemCount - 1
          }
        }
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = itemCount - 1
        break
      default:
        return
    }

    if (newIndex !== currentIndex) {
      onIndexChange(newIndex)
    }
  }, [enabled, itemCount, currentIndex, onIndexChange, wrap, orientation])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Format a keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []

  if (shortcut.ctrl) {
    parts.push(navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl')
  }
  if (shortcut.alt) {
    parts.push('Alt')
  }
  if (shortcut.shift) {
    parts.push('Shift')
  }

  parts.push(shortcut.key.toUpperCase())

  return parts.join('+')
}
