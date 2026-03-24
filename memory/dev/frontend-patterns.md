---
id: dev-frontend-patterns
scope: SCANDAT ICU Transfusion Dashboard frontend architecture and patterns
soul_tags:
  - Mechanism
  - Understanding
  - Uniformity
  - Rigor
  - Reproducibility
branch: dev
type: topic
last_updated: "2026-03-24"
---

# Frontend Patterns

## What to Know

The SCANDAT ICU Transfusion Dashboard is a tab-based React 18 SPA built with TypeScript 5 and Vite 5. There are five tabs, each lazy-loaded in App.tsx and wrapped in ErrorBoundary + Suspense. A single Zustand 4 store (dashboardStore.ts) manages global state, persisting only theme and activeTab to localStorage. All clinical data arrives as CSV files fetched at runtime through dataService.ts, parsed by PapaParse, and cached in memory with a 5-minute TTL via cache.ts. Charts render through Chart.js 4 with react-chartjs-2, using a shared BaseChart wrapper and a library of config/transform/plugin helpers in src/components/charts/. Path aliases map @/ to src/. Styling uses CSS modules per component plus a global CSS file with custom properties that switch between dark and light themes via a data-theme attribute on the root element. The GlossaryProvider context sits near the top of the tree, giving every tab access to clinical term definitions.

## Understanding

### Tab Architecture

Five tabs compose the dashboard: Overview, DescriptiveStatistics, MainFindings, RBCTransfusions, and ComponentFactorEffects. Each tab is a standalone module under src/components/tabs/ and is lazy-loaded via React.lazy() in App.tsx to keep the initial bundle small. Every lazy import is wrapped in both a Suspense boundary (with a loading fallback) and an ErrorBoundary so that a failure in one tab does not crash the entire application.

Tab navigation is driven by the activeTab field in the Zustand store. The Layout component reads activeTab and renders the corresponding TabPanel, which handles the visual selected/unselected state. GlossaryProvider sits above the tab rendering tree, making clinical glossary lookups available to any component through useContext without prop drilling.

The tab components themselves are fairly self-contained: each one calls its own data-fetching hooks, manages local UI state (selected vital parameters, time ranges, etc.), and renders its own chart and table arrangements. Shared controls like selectors, sliders, and vital-parameter buttons live in src/components/controls/ and are imported by whichever tabs need them.

### State Management

The Zustand store is defined in src/stores/dashboardStore.ts. Its shape is split across two TypeScript interfaces in src/types/store.ts: DashboardState for data fields and DashboardActions for mutators. The store is created with zustand/middleware's persist, but the partialize option restricts persistence to only the theme string and the activeTab identifier. Everything else (selected parameters, loaded data references, transient UI flags) resets on page reload. This is deliberate: clinical data should always be freshly fetched, never stale from localStorage.

Consumer components access the store through the useDashboardStore hook. To avoid unnecessary re-renders, selectors are used with zustand's useShallow comparator. Several named selector functions are exported alongside the store for common access patterns (e.g., selecting the current vital parameter codes, selecting theme). When a component only needs one or two fields, an inline selector is acceptable, but for any selector used in more than one place, a named export is preferred.

State reset is handled by a resetStore action that returns transient fields to their defaults without clearing the persisted theme and activeTab. This is used during error recovery and when the user explicitly resets filters.

### Data Flow

The data pipeline from disk to screen follows a well-defined chain: CSV fetch, parse, cache, hook, chart.

dataService.ts exposes functions that call fetchCSVWithFallback, which attempts to load a CSV file from public/data/ and falls back gracefully if the file is missing (returning an empty dataset rather than throwing). Successful fetches are parsed by PapaParse (via the csvParser module) into typed arrays of row objects. The parsed result is stored in DataCache (cache.ts), an in-memory map with a 5-minute TTL per entry keyed by file path.

On application startup, App.tsx calls preloadData(), which fetches a core subset of CSV files that most tabs need. Individual tabs may trigger additional fetches on mount for their specific datasets. The function loadVizIndex() loads a routing table (viz_index.csv) that maps vital-parameter and component-factor codes to their corresponding CSV filenames, so tabs can look up which file to request without hardcoding paths.

Custom hooks in src/hooks/ wrap the data-service calls, returning { data, loading, error } tuples that tabs consume directly. These hooks handle the loading lifecycle and pass parsed data arrays to Chart.js through the prepareChartData transformation utility.

The 61 CSV files in public/data/ are manually copied from the SAS pipeline output in analysis/script_data/. There is no automated sync; this is a deliberate checkpoint to allow manual review before clinical data reaches the frontend.

### Type System

Clinical domain types live in src/types/vitals.ts. Two key constant objects define the vocabulary: VITAL_PARAM_CODES (mapping short codes like "HR", "MAP", "SpO2" to their full clinical names and units) and COMP_FACTOR_CODES (mapping component and factor identifiers to display labels). These constants are the single source of truth for parameter enumeration across the entire frontend.

Supporting interfaces include VitalParamInfo and CompFactorInfo, which describe the shape of individual parameter metadata (code, label, unit, display order). These are used by the control components to render selector options and by the chart layer to set axis labels and tooltips.

src/types/data.ts defines the row shapes of each CSV file category (descriptive stats rows, visualization time-series rows, statistics summary rows). These interfaces mirror the column names produced by the SAS scripts. src/types/store.ts defines DashboardState and DashboardActions as described above.

Path aliases (@/) allow all imports to use absolute paths from src/, avoiding brittle relative imports that break during refactors.

### Chart.js Patterns

All charts render through the BaseChart component in src/components/charts/, which wraps react-chartjs-2's Chart component with project-standard defaults. BaseChart accepts a chart type, processed data, and an optional overrides object, merging everything with the defaults from chartConfig.

chartConfig provides sensible defaults for axes, legends, tooltips, and responsive behavior. Colors, font sizes, and grid styles adapt to the current theme (read from the Zustand store or CSS custom properties).

prepareChartData is the transformation layer between raw parsed CSV rows and the Chart.js dataset format. It groups rows by series, maps time columns to x-axis values, and attaches styling metadata (colors, line dash patterns, point styles) based on parameter codes.

The verticalLinePlugin is a custom Chart.js plugin that draws a vertical reference line at T=0 (the transfusion event time) across all time-series charts. It reads its configuration from the chart options and renders during the afterDraw hook.

exportChart provides two download paths: PNG (via canvas.toDataURL) and CSV (serializing the current chart datasets back to a downloadable CSV string). Both are triggered by UI buttons on each chart panel.

### CSS Patterns

Component-level styles use CSS modules (*.module.css files colocated with their components). This scopes class names automatically and prevents style collisions between tabs.

Global styles live in src/styles/global.css, which defines CSS custom properties (--color-bg, --color-text, --color-primary, --color-border, etc.) under two selectors: [data-theme="light"] and [data-theme="dark"]. Theme switching toggles the data-theme attribute on the root HTML element, and all custom properties cascade automatically. The Zustand store's theme field drives this attribute.

Design tokens for spacing, border radii, and font stacks are also in global.css as custom properties, providing a single place to adjust the visual language. Components reference these tokens rather than hardcoding values.
