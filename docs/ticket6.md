# T-006: Layout Shell Components

| Field | Value |
|-------|-------|
| **ID** | T-006 |
| **Title** | Layout Shell Components |
| **Phase** | 4 - Core Components |
| **Priority** | High |
| **Depends On** | T-001, T-002, T-005 |
| **Blocks** | T-009, T-010, T-011, T-012 |
| **Estimated Effort** | 3-4 hours |

---

## Objective

Create the application shell: header, tab navigation, and main layout container. These components provide the structural foundation for all tab content.

---

## Context

The legacy application has:
- Fixed header with title and theme toggle
- Horizontal scrolling tab navigation (4 tabs)
- Tab panels that show/hide based on selection
- Loading overlay and toast notifications

The new layout will use CSS Grid for better responsiveness.

---

## Requirements

### 1. Header Component

**`src/components/layout/Header.tsx`:**

```typescript
import { useDashboardStore } from '@/stores/dashboardStore'
import styles from './Header.module.css'

export function Header() {
  const { theme, toggleTheme } = useDashboardStore()
  
  return (
    <header className={styles.header}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>SCANDAT ICU Transfusion Dashboard</h1>
        <span className={styles.subtitle}>
          Stockholm Region • 2014-2018 • 6,736 patients • 14,655 transfusions
        </span>
      </div>
      
      <button 
        className={styles.themeToggle}
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  )
}
```

**`src/components/layout/Header.module.css`:**

```css
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-6);
  background-color: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border-default);
}

.titleGroup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  margin: 0;
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.themeToggle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-lg);
  transition: all var(--transition-fast);
}

.themeToggle:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-border-emphasis);
}

@media (max-width: 768px) {
  .header {
    padding: var(--spacing-3) var(--spacing-4);
  }
  
  .title {
    font-size: var(--text-xl);
  }
  
  .subtitle {
    display: none;
  }
}
```

### 2. Tab Navigation Component

**`src/components/layout/TabNavigation.tsx`:**

```typescript
import { useDashboardStore } from '@/stores/dashboardStore'
import styles from './TabNavigation.module.css'

const TABS = [
  { id: 'main-findings', label: 'Main Findings' },
  { id: 'rbc-transfusions', label: 'RBC Transfusion Effects' },
  { id: 'component-factor-effects', label: 'Component Factor Effects' },
  { id: 'descriptive-statistics', label: 'Descriptive Statistics' },
] as const

export function TabNavigation() {
  const { activeTab, setActiveTab } = useDashboardStore()
  
  return (
    <nav className={styles.tabNav} role="tablist" aria-label="Dashboard sections">
      {TABS.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
```

**`src/components/layout/TabNavigation.module.css`:**

```css
.tabNav {
  display: flex;
  gap: var(--spacing-1);
  padding: var(--spacing-2) var(--spacing-6);
  background-color: var(--color-bg-main);
  border-bottom: 1px solid var(--color-border-default);
  overflow-x: auto;
  scrollbar-width: none;
}

.tabNav::-webkit-scrollbar {
  display: none;
}

.tabButton {
  flex-shrink: 0;
  padding: var(--spacing-3) var(--spacing-5);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.tabButton:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-hover);
}

.tabButton.active {
  color: var(--color-accent-primary);
  background-color: var(--color-bg-card);
}

@media (max-width: 768px) {
  .tabNav {
    padding: var(--spacing-2) var(--spacing-4);
  }
  
  .tabButton {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--text-xs);
  }
}
```

### 3. Tab Panel Component

**`src/components/layout/TabPanel.tsx`:**

```typescript
import { ReactNode } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'
import styles from './TabPanel.module.css'

interface TabPanelProps {
  id: string
  children: ReactNode
}

export function TabPanel({ id, children }: TabPanelProps) {
  const activeTab = useDashboardStore(s => s.activeTab)
  const isActive = activeTab === id
  
  if (!isActive) return null
  
  return (
    <div
      id={`${id}-panel`}
      role="tabpanel"
      aria-labelledby={id}
      className={styles.panel}
    >
      {children}
    </div>
  )
}
```

**`src/components/layout/TabPanel.module.css`:**

```css
.panel {
  flex: 1;
  padding: var(--spacing-6);
  overflow-y: auto;
}

@media (max-width: 768px) {
  .panel {
    padding: var(--spacing-4);
  }
}
```

### 4. Loading Overlay Component

**`src/components/layout/LoadingOverlay.tsx`:**

```typescript
import { useDashboardStore } from '@/stores/dashboardStore'
import styles from './LoadingOverlay.module.css'

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  const isLoading = useDashboardStore(s => s.isLoading)
  
  if (!isLoading) return null
  
  return (
    <div className={styles.overlay} aria-busy="true" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.spinner} />
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  )
}
```

**`src/components/layout/LoadingOverlay.module.css`:**

```css
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: var(--z-modal-backdrop);
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--color-border-default);
  border-top-color: var(--color-accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.message {
  color: var(--color-text-primary);
  font-size: var(--text-sm);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 5. Error Toast Component

**`src/components/layout/ErrorToast.tsx`:**

```typescript
import { useEffect } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'
import styles from './ErrorToast.module.css'

export function ErrorToast() {
  const { error, clearError } = useDashboardStore()
  
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 10000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])
  
  if (!error) return null
  
  return (
    <div className={styles.toast} role="alert">
      <span className={styles.icon}>⚠️</span>
      <p className={styles.message}>{error}</p>
      <button 
        className={styles.closeBtn} 
        onClick={clearError}
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  )
}
```

**`src/components/layout/ErrorToast.module.css`:**

```css
.toast {
  position: fixed;
  bottom: var(--spacing-6);
  right: var(--spacing-6);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  max-width: 400px;
  background-color: var(--color-bg-card);
  border-left: 4px solid var(--color-error);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-toast);
  animation: slideIn 0.3s ease;
}

.icon {
  font-size: var(--text-xl);
}

.message {
  flex: 1;
  color: var(--color-text-primary);
  font-size: var(--text-sm);
}

.closeBtn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--text-lg);
}

.closeBtn:hover {
  color: var(--color-text-primary);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### 6. Main Layout Component

**`src/components/layout/Layout.tsx`:**

```typescript
import { ReactNode } from 'react'
import { Header } from './Header'
import { TabNavigation } from './TabNavigation'
import { LoadingOverlay } from './LoadingOverlay'
import { ErrorToast } from './ErrorToast'
import styles from './Layout.module.css'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <Header />
      <TabNavigation />
      <main className={styles.main}>
        {children}
      </main>
      <LoadingOverlay />
      <ErrorToast />
    </div>
  )
}
```

**`src/components/layout/Layout.module.css`:**

```css
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-bg-main);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

### 7. Index Export

**`src/components/layout/index.ts`:**

```typescript
export { Header } from './Header'
export { TabNavigation } from './TabNavigation'
export { TabPanel } from './TabPanel'
export { LoadingOverlay } from './LoadingOverlay'
export { ErrorToast } from './ErrorToast'
export { Layout } from './Layout'
```

### 8. Update App.tsx

```typescript
import { useEffect } from 'react'
import { Layout, TabPanel } from '@/components/layout'
import { useDashboardStore, useThemeSync } from '@/stores/dashboardStore'
import './styles/global.css'

function App() {
  useThemeSync()

  return (
    <Layout>
      <TabPanel id="main-findings">
        <p>Main Findings content (T-009)</p>
      </TabPanel>
      
      <TabPanel id="rbc-transfusions">
        <p>RBC Transfusions content (T-010)</p>
      </TabPanel>
      
      <TabPanel id="component-factor-effects">
        <p>Component Factor Effects content (T-011)</p>
      </TabPanel>
      
      <TabPanel id="descriptive-statistics">
        <p>Descriptive Statistics content (T-012)</p>
      </TabPanel>
    </Layout>
  )
}

export default App
```

---

## Acceptance Criteria

- [ ] Header displays title, subtitle, and theme toggle
- [ ] Theme toggle switches between dark/light modes
- [ ] Tab navigation shows all 4 tabs
- [ ] Active tab is visually highlighted
- [ ] Tab panels show/hide based on active tab
- [ ] Loading overlay appears when `isLoading` is true
- [ ] Error toast appears and auto-dismisses after 10 seconds
- [ ] Layout is responsive (tablet/mobile breakpoints work)
- [ ] All components pass accessibility audit (ARIA roles, labels)

---

## Notes for Agent

1. **CSS Modules**: Each component has its own `.module.css` file. Styles are scoped automatically.

2. **ARIA Attributes**: Tab navigation uses proper ARIA roles. This is required for accessibility.

3. **No Emoji in Production**: The theme toggle uses emoji for simplicity. Consider SVG icons for production.

4. **Responsive First**: Mobile styles are handled with `@media (max-width: ...)` queries.

5. **Z-Index Scale**: Use CSS variable z-index values (`--z-toast`, etc.) for consistency.