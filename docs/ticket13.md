# T-013: Responsive Layout & Accessibility

| Field | Value |
|-------|-------|
| **ID** | T-013 |
| **Title** | Responsive Layout & Accessibility |
| **Phase** | 6 - Polish & Deploy |
| **Priority** | High |
| **Depends On** | T-009, T-010, T-011, T-012 |
| **Blocks** | T-015 |
| **Estimated Effort** | 3-4 hours |

---

## Objective

Ensure the dashboard is fully responsive across all device sizes and meets WCAG 2.1 AA accessibility standards.

---

## Context

The dashboard must work on:
- Desktop (1920px+): Full feature set with side-by-side layouts
- Laptop (1024px-1919px): Slightly condensed but full features
- Tablet (768px-1023px): Stacked layouts, touch-friendly controls
- Mobile (320px-767px): Single column, essential features only

Accessibility requirements:
- Keyboard navigation for all interactive elements
- Screen reader support with proper ARIA labels
- Sufficient color contrast
- Focus indicators
- Reduced motion support

---

## Requirements

### 1. Responsive Breakpoint System

**`src/styles/breakpoints.css`** (add to global.css import):

```css
/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE BREAKPOINTS
   ═══════════════════════════════════════════════════════════════ */

/*
  Breakpoint Reference:
  - xs: 0-479px (small phones)
  - sm: 480-767px (large phones)
  - md: 768-1023px (tablets)
  - lg: 1024-1279px (laptops)
  - xl: 1280-1535px (desktops)
  - 2xl: 1536px+ (large desktops)
*/

/* Container queries for component-level responsiveness */
@supports (container-type: inline-size) {
  .chart-container {
    container-type: inline-size;
    container-name: chart;
  }
  
  @container chart (max-width: 400px) {
    .chart-legend {
      display: none;
    }
  }
}

/* Mobile-first base styles are in component CSS modules */
/* These are global overrides and utilities */

/* Hide on mobile */
@media (max-width: 767px) {
  .hide-mobile {
    display: none !important;
  }
}

/* Hide on desktop */
@media (min-width: 768px) {
  .hide-desktop {
    display: none !important;
  }
}

/* Stack on mobile */
@media (max-width: 767px) {
  .stack-mobile {
    flex-direction: column !important;
  }
  
  .stack-mobile > * {
    width: 100% !important;
  }
}

/* Touch-friendly sizing */
@media (pointer: coarse) {
  button,
  select,
  input[type="checkbox"],
  .interactive {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### 2. Accessibility Utilities

**`src/styles/accessibility.css`** (add to global.css import):

```css
/* ═══════════════════════════════════════════════════════════════
   ACCESSIBILITY STYLES
   ═══════════════════════════════════════════════════════════════ */

/* Focus Visible - Modern browsers only show on keyboard nav */
:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

/* Remove default focus for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 9999;
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-accent-primary);
  color: white;
  font-weight: var(--font-medium);
  text-decoration: none;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High Contrast Mode adjustments */
@media (prefers-contrast: high) {
  :root {
    --color-border-default: currentColor;
    --color-border-emphasis: currentColor;
  }
  
  .card,
  .btn,
  select,
  input {
    border-width: 2px;
  }
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Announce to screen readers */
.sr-announce {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

[aria-live="polite"],
[aria-live="assertive"] {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 3. Skip Link Component

**`src/components/layout/SkipLink.tsx`:**

```typescript
import styles from './SkipLink.module.css'

export function SkipLink() {
  return (
    <a href="#main-content" className={styles.skipLink}>
      Skip to main content
    </a>
  )
}
```

**`src/components/layout/SkipLink.module.css`:**

```css
.skipLink {
  position: absolute;
  top: -100%;
  left: var(--spacing-4);
  z-index: 9999;
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-accent-primary);
  color: white;
  font-weight: var(--font-medium);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: top 0.2s ease;
}

.skipLink:focus {
  top: var(--spacing-4);
}
```

### 4. Live Region for Announcements

**`src/components/layout/LiveRegion.tsx`:**

```typescript
import { useEffect, useState } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'

export function LiveRegion() {
  const [announcement, setAnnouncement] = useState('')
  const { isLoading, error, activeTab } = useDashboardStore()
  
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
    const tabNames: Record<string, string> = {
      'main-findings': 'Main Findings',
      'rbc-transfusions': 'RBC Transfusion Effects',
      'component-factor-effects': 'Component Factor Effects',
      'descriptive-statistics': 'Descriptive Statistics',
    }
    setAnnouncement(`Navigated to ${tabNames[activeTab]} tab`)
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
```

### 5. Update Layout Component

**Update `src/components/layout/Layout.tsx`:**

```typescript
import { ReactNode } from 'react'
import { Header } from './Header'
import { TabNavigation } from './TabNavigation'
import { LoadingOverlay } from './LoadingOverlay'
import { ErrorToast } from './ErrorToast'
import { SkipLink } from './SkipLink'
import { LiveRegion } from './LiveRegion'
import styles from './Layout.module.css'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <SkipLink />
      <LiveRegion />
      <Header />
      <TabNavigation />
      <main id="main-content" className={styles.main} tabIndex={-1}>
        {children}
      </main>
      <LoadingOverlay />
      <ErrorToast />
    </div>
  )
}
```

### 6. Keyboard Navigation Hook

**`src/hooks/useKeyboardNavigation.ts`:**

```typescript
import { useEffect, useCallback } from 'react'

interface KeyboardShortcuts {
  [key: string]: () => void
}

export function useKeyboardNavigation(shortcuts: KeyboardShortcuts) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return
    }
    
    const key = event.key.toLowerCase()
    const withMeta = event.metaKey || event.ctrlKey
    
    // Build shortcut string
    let shortcut = ''
    if (withMeta) shortcut += 'mod+'
    if (event.shiftKey) shortcut += 'shift+'
    if (event.altKey) shortcut += 'alt+'
    shortcut += key
    
    if (shortcuts[shortcut]) {
      event.preventDefault()
      shortcuts[shortcut]()
    }
  }, [shortcuts])
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Example usage in App.tsx:
// useKeyboardNavigation({
//   '1': () => setActiveTab('main-findings'),
//   '2': () => setActiveTab('rbc-transfusions'),
//   '3': () => setActiveTab('component-factor-effects'),
//   '4': () => setActiveTab('descriptive-statistics'),
//   't': () => toggleTheme(),
// })
```

### 7. Responsive Chart Wrapper

**`src/components/charts/ResponsiveChart.tsx`:**

```typescript
import { useRef, useState, useEffect, ReactNode } from 'react'

interface ResponsiveChartProps {
  children: (dimensions: { width: number; height: number }) => ReactNode
  aspectRatio?: number
  minHeight?: number
  maxHeight?: number
}

export function ResponsiveChart({
  children,
  aspectRatio = 16 / 9,
  minHeight = 200,
  maxHeight = 500,
}: ResponsiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const width = entry.contentRect.width
        let height = width / aspectRatio
        height = Math.max(minHeight, Math.min(maxHeight, height))
        setDimensions({ width, height })
      }
    })
    
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [aspectRatio, minHeight, maxHeight])
  
  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {dimensions.width > 0 && children(dimensions)}
    </div>
  )
}
```

### 8. Mobile Navigation (Hamburger Menu)

**`src/components/layout/MobileNav.tsx`:**

```typescript
import { useState } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'
import styles from './MobileNav.module.css'

const TABS = [
  { id: 'main-findings', label: 'Main Findings' },
  { id: 'rbc-transfusions', label: 'RBC Transfusion Effects' },
  { id: 'component-factor-effects', label: 'Component Factor Effects' },
  { id: 'descriptive-statistics', label: 'Descriptive Statistics' },
] as const

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { activeTab, setActiveTab } = useDashboardStore()
  
  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId as any)
    setIsOpen(false)
  }
  
  return (
    <div className={styles.mobileNav}>
      <button
        className={styles.menuButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label="Toggle navigation menu"
      >
        <span className={styles.menuIcon}>
          {isOpen ? '✕' : '☰'}
        </span>
        <span className={styles.currentTab}>
          {TABS.find(t => t.id === activeTab)?.label}
        </span>
      </button>
      
      {isOpen && (
        <nav id="mobile-menu" className={styles.menu} role="navigation">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.menuItem} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => handleTabSelect(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
```

**`src/components/layout/MobileNav.module.css`:**

```css
.mobileNav {
  display: none;
  position: relative;
}

@media (max-width: 767px) {
  .mobileNav {
    display: block;
  }
}

.menuButton {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-bg-card);
  border: none;
  border-bottom: 1px solid var(--color-border-default);
  cursor: pointer;
}

.menuIcon {
  font-size: var(--text-xl);
}

.currentTab {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border-default);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
}

.menuItem {
  display: block;
  width: 100%;
  padding: var(--spacing-4);
  text-align: left;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
}

.menuItem:hover {
  background-color: var(--color-bg-hover);
}

.menuItem.active {
  color: var(--color-accent-primary);
  font-weight: var(--font-medium);
}
```

---

## Acceptance Criteria

### Responsive
- [ ] Dashboard renders correctly at 320px width
- [ ] Dashboard renders correctly at 768px width
- [ ] Dashboard renders correctly at 1920px width
- [ ] Charts resize smoothly when window resizes
- [ ] Touch targets are at least 44×44px on touch devices
- [ ] Sidebar stacks below content on mobile
- [ ] Mobile navigation menu works correctly

### Accessibility
- [ ] Skip link appears on focus and works
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Screen reader announces loading states
- [ ] Screen reader announces tab changes
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Charts have accessible descriptions
- [ ] Reduced motion preference is respected

### Testing
- [ ] Test with keyboard-only navigation
- [ ] Test with VoiceOver (macOS) or NVDA (Windows)
- [ ] Test with browser zoom at 200%
- [ ] Test in Chrome, Firefox, Safari
- [ ] Run Lighthouse accessibility audit (score > 90)

---

## Notes for Agent

1. **CSS Import Order**: Add breakpoints.css and accessibility.css to global.css imports.

2. **Container Queries**: Use for component-level responsiveness when supported.

3. **Focus Management**: Main content has `tabIndex={-1}` for skip link target.

4. **Live Regions**: Keep announcements brief and meaningful.

5. **Testing Tools**: Use axe DevTools extension for accessibility auditing.