# T-005: Zustand Store Implementation

| Field | Value |
|-------|-------|
| **ID** | T-005 |
| **Title** | Zustand Store Implementation |
| **Phase** | 3 - State Management |
| **Priority** | Critical |
| **Depends On** | T-003 |
| **Blocks** | T-006, T-007, T-008 |
| **Estimated Effort** | 2-3 hours |

---

## Objective

Implement centralized state management using Zustand. This replaces the scattered state across `dashboard.js` class properties, module-level objects, and DOM state.

---

## Context

The legacy application has state scattered across:
- `TransfusionDashboard` class properties (798 lines)
- `transfusions.js` module state object
- DOM element values (dropdown selections, checkbox states)
- localStorage (theme only)

This causes desync issues documented in architecture.md. Zustand provides a single source of truth.

---

## Requirements

### 1. Main Dashboard Store

**`src/stores/dashboardStore.ts`:**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  VitalParamCode,
  CompFactorCode,
  TimeRange,
  ChartDisplayOptions,
  VisualizationData,
  DEFAULT_TIME_RANGE,
  DEFAULT_DISPLAY_OPTIONS,
} from '@/types'

// ============================================================
// TYPES
// ============================================================

type Theme = 'dark' | 'light'

type ActiveTab = 
  | 'main-findings'
  | 'rbc-transfusions'
  | 'component-factor-effects'
  | 'descriptive-statistics'

interface DashboardState {
  // UI State
  theme: Theme
  activeTab: ActiveTab
  isLoading: boolean
  error: string | null
  
  // Component Factor Effects Tab
  selectedVital: VitalParamCode | null
  selectedCompFactor: CompFactorCode | null
  selectedComparisons: (string | number)[]
  timeRange: TimeRange
  displayOptions: ChartDisplayOptions
  visualizationData: VisualizationData | null
  
  // RBC Transfusions Tab
  transfusionSelectedVitals: VitalParamCode[]
  transfusionTimeRange: TimeRange
  transfusionDisplayOptions: ChartDisplayOptions
  
  // Available options (from viz_index)
  availableVitals: VitalParamCode[]
  availableCompFactors: CompFactorCode[]
}

interface DashboardActions {
  // Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  
  // Tab Navigation
  setActiveTab: (tab: ActiveTab) => void
  
  // Loading/Error
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Component Factor Effects
  setSelectedVital: (vital: VitalParamCode | null) => void
  setSelectedCompFactor: (factor: CompFactorCode | null) => void
  setSelectedComparisons: (comparisons: (string | number)[]) => void
  toggleComparison: (value: string | number) => void
  selectAllComparisons: (values: (string | number)[]) => void
  setTimeRange: (range: TimeRange) => void
  setDisplayOption: <K extends keyof ChartDisplayOptions>(
    key: K, 
    value: ChartDisplayOptions[K]
  ) => void
  setVisualizationData: (data: VisualizationData | null) => void
  
  // RBC Transfusions
  toggleTransfusionVital: (vital: VitalParamCode) => void
  setTransfusionTimeRange: (range: TimeRange) => void
  setTransfusionDisplayOption: <K extends keyof ChartDisplayOptions>(
    key: K, 
    value: ChartDisplayOptions[K]
  ) => void
  
  // Available Options
  setAvailableVitals: (vitals: VitalParamCode[]) => void
  setAvailableCompFactors: (factors: CompFactorCode[]) => void
  
  // Reset
  resetToDefaults: () => void
}

type DashboardStore = DashboardState & DashboardActions

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: DashboardState = {
  // UI State
  theme: 'dark',
  activeTab: 'main-findings',
  isLoading: false,
  error: null,
  
  // Component Factor Effects Tab
  selectedVital: null,
  selectedCompFactor: null,
  selectedComparisons: [],
  timeRange: [0, 720],
  displayOptions: {
    showConfidenceInterval: true,
    showBaseModel: false,
    showDeltaPlot: true,
  },
  visualizationData: null,
  
  // RBC Transfusions Tab
  transfusionSelectedVitals: [],
  transfusionTimeRange: [0, 720],
  transfusionDisplayOptions: {
    showConfidenceInterval: true,
    showBaseModel: false,
    showDeltaPlot: true,
  },
  
  // Available options
  availableVitals: [],
  availableCompFactors: [],
}

// ============================================================
// STORE IMPLEMENTATION
// ============================================================

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ─────────────────────────────────────────────────────
      // Theme Actions
      // ─────────────────────────────────────────────────────
      setTheme: (theme) => {
        set({ theme })
        // Apply to DOM for CSS variables
        document.body.classList.toggle('light-theme', theme === 'light')
      },
      
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark'
        get().setTheme(newTheme)
      },
      
      // ─────────────────────────────────────────────────────
      // Tab Navigation
      // ─────────────────────────────────────────────────────
      setActiveTab: (activeTab) => set({ activeTab }),
      
      // ─────────────────────────────────────────────────────
      // Loading/Error
      // ─────────────────────────────────────────────────────
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      // ─────────────────────────────────────────────────────
      // Component Factor Effects Actions
      // ─────────────────────────────────────────────────────
      setSelectedVital: (selectedVital) => set({ 
        selectedVital,
        // Reset dependent state when vital changes
        selectedCompFactor: null,
        selectedComparisons: [],
        visualizationData: null,
      }),
      
      setSelectedCompFactor: (selectedCompFactor) => set({ 
        selectedCompFactor,
        // Reset comparisons when factor changes
        selectedComparisons: [],
        visualizationData: null,
      }),
      
      setSelectedComparisons: (selectedComparisons) => set({ selectedComparisons }),
      
      toggleComparison: (value) => {
        const current = get().selectedComparisons
        const exists = current.includes(value)
        set({
          selectedComparisons: exists
            ? current.filter(v => v !== value)
            : [...current, value]
        })
      },
      
      selectAllComparisons: (values) => set({ selectedComparisons: values }),
      
      setTimeRange: (timeRange) => set({ timeRange }),
      
      setDisplayOption: (key, value) => set(state => ({
        displayOptions: { ...state.displayOptions, [key]: value }
      })),
      
      setVisualizationData: (visualizationData) => set({ visualizationData }),
      
      // ─────────────────────────────────────────────────────
      // RBC Transfusions Actions
      // ─────────────────────────────────────────────────────
      toggleTransfusionVital: (vital) => {
        const current = get().transfusionSelectedVitals
        const exists = current.includes(vital)
        set({
          transfusionSelectedVitals: exists
            ? current.filter(v => v !== vital)
            : [...current, vital]
        })
      },
      
      setTransfusionTimeRange: (transfusionTimeRange) => set({ transfusionTimeRange }),
      
      setTransfusionDisplayOption: (key, value) => set(state => ({
        transfusionDisplayOptions: { ...state.transfusionDisplayOptions, [key]: value }
      })),
      
      // ─────────────────────────────────────────────────────
      // Available Options
      // ─────────────────────────────────────────────────────
      setAvailableVitals: (availableVitals) => set({ availableVitals }),
      setAvailableCompFactors: (availableCompFactors) => set({ availableCompFactors }),
      
      // ─────────────────────────────────────────────────────
      // Reset
      // ─────────────────────────────────────────────────────
      resetToDefaults: () => set({
        ...initialState,
        theme: get().theme, // Preserve theme preference
      }),
    }),
    {
      name: 'scandat-dashboard-storage',
      // Only persist theme preference
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)

// ============================================================
// SELECTORS (for performance optimization)
// ============================================================

export const selectTheme = (state: DashboardStore) => state.theme
export const selectActiveTab = (state: DashboardStore) => state.activeTab
export const selectIsLoading = (state: DashboardStore) => state.isLoading
export const selectError = (state: DashboardStore) => state.error

export const selectComponentFactorState = (state: DashboardStore) => ({
  selectedVital: state.selectedVital,
  selectedCompFactor: state.selectedCompFactor,
  selectedComparisons: state.selectedComparisons,
  timeRange: state.timeRange,
  displayOptions: state.displayOptions,
  visualizationData: state.visualizationData,
})

export const selectTransfusionState = (state: DashboardStore) => ({
  selectedVitals: state.transfusionSelectedVitals,
  timeRange: state.transfusionTimeRange,
  displayOptions: state.transfusionDisplayOptions,
})

// ============================================================
// HOOKS FOR COMMON PATTERNS
// ============================================================

/**
 * Hook to sync theme with DOM on mount
 */
export function useThemeSync() {
  const theme = useDashboardStore(selectTheme)
  
  // Sync on mount and theme change
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('light-theme', theme === 'light')
  }
  
  return theme
}
```

### 2. Theme Integration

**Update `src/hooks/useChartTheme.ts`** to use store:

```typescript
import { useMemo } from 'react'
import { useDashboardStore, selectTheme } from '@/stores/dashboardStore'

export interface ChartTheme {
  gridColor: string
  tickColor: string
  legendColor: string
  tooltipBackground: string
  tooltipText: string
  fontFamily: string
}

export function useChartTheme(): ChartTheme {
  const theme = useDashboardStore(selectTheme)
  const isLight = theme === 'light'

  return useMemo(() => ({
    gridColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    tickColor: isLight ? '#333333' : '#ffffff',
    legendColor: isLight ? '#333333' : '#ffffff',
    tooltipBackground: isLight ? '#ffffff' : '#1a1a1a',
    tooltipText: isLight ? '#111827' : '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  }), [isLight])
}

export const CHART_COLORS = [
  '#635BFF', '#E82127', '#10B981', '#F59E0B',
  '#0A84FF', '#8B5CF6', '#EC4899', '#06B6D4',
] as const

export const SCANDAT_RED = '#E82127'
```

### 3. App Integration

**Update `src/App.tsx`** to initialize theme:

```typescript
import { useEffect } from 'react'
import { useDashboardStore, useThemeSync } from '@/stores/dashboardStore'
import './styles/global.css'

function App() {
  // Sync theme on mount
  useThemeSync()
  
  // Load initial data
  const setAvailableVitals = useDashboardStore(s => s.setAvailableVitals)
  
  useEffect(() => {
    // Data loading will be implemented in tab components
  }, [])

  return (
    <div className="app">
      {/* Layout components will be added in T-006 */}
      <p>Dashboard initializing...</p>
    </div>
  )
}

export default App
```

---

## Acceptance Criteria

- [ ] Store compiles without TypeScript errors
- [ ] Theme toggle updates both store and DOM class
- [ ] Theme persists across page refreshes (localStorage)
- [ ] Selecting a vital resets dependent state (compFactor, comparisons)
- [ ] Selecting a compFactor resets comparisons
- [ ] Toggle functions work correctly for comparisons and transfusion vitals
- [ ] Selectors are memoized and don't cause unnecessary re-renders
- [ ] `resetToDefaults` preserves theme preference

---

## Testing

```tsx
// Test component (delete after verification)
import { useDashboardStore } from '@/stores/dashboardStore'

function StoreTest() {
  const { 
    theme, toggleTheme,
    selectedVital, setSelectedVital,
    selectedComparisons, toggleComparison,
  } = useDashboardStore()
  
  return (
    <div>
      <p>Theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      
      <p>Vital: {selectedVital ?? 'none'}</p>
      <button onClick={() => setSelectedVital('ARTm')}>Select ARTm</button>
      
      <p>Comparisons: {selectedComparisons.join(', ')}</p>
      <button onClick={() => toggleComparison('Male')}>Toggle Male</button>
    </div>
  )
}
```

---

## Notes for Agent

1. **Zustand Persist**: Only theme is persisted. Other state resets on refresh (intentional for scientific accuracy).

2. **Cascading Resets**: When vital changes, compFactor and comparisons must reset. This prevents stale state.

3. **DOM Sync**: Theme must sync to DOM for CSS variables. The `useThemeSync` hook handles this.

4. **Selectors**: Use selectors for derived state to prevent re-renders. Components should subscribe to minimal state.

5. **No Async in Store**: Keep the store synchronous. Async operations happen in components/hooks that call store actions after data loads.