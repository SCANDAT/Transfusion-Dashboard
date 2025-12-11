# SCANDAT ICU Dashboard Refactor Roadmap

> **Project**: Modernize legacy vanilla JS dashboard to React + TypeScript  
> **Scope**: Full architectural refactor with preserved aesthetics  
> **Target**: Modular, maintainable, performant SPA  
> **Estimated Duration**: 8-12 days  
> **Parallelization**: Up to 4 agents working simultaneously in later phases

---

## How to Use This Roadmap

### For Human Reviewers
This roadmap provides a complete architectural plan for migrating a legacy scientific visualization dashboard. Review the phase structure, dependencies, and success criteria to understand the scope and approach.

### For AI Agents
Each ticket in `/tickets/` is **standalone** and contains:
- Full context needed to complete the work
- Explicit file paths and code snippets
- Acceptance criteria for verification
- Notes on edge cases and gotchas

**Parallelization Rules:**
- Tickets within the same phase CAN run in parallel (after dependencies met)
- Always check "Depends On" field before starting a ticket
- Mark tickets complete only when ALL acceptance criteria pass

---

## Project Overview

### What We're Building
A modern React + TypeScript dashboard that visualizes peer-reviewed ICU transfusion research data. The dashboard displays statistical analyses of how RBC (red blood cell) transfusions affect patient vital signs, with breakdowns by donor and storage characteristics.

### Source Data
- **Study**: 6,736 ICU patients, 14,655 RBC transfusions
- **Period**: January 2014 – November 2018
- **Location**: Four Stockholm-region hospitals
- **Data Format**: 60+ pre-computed CSV files (~120MB total)

### Core Features
1. **Main Findings Tab**: Summary tables and 35-chart small multiples grid
2. **RBC Transfusions Tab**: Multi-vital effect plots with LOESS smoothing
3. **Component Factor Effects Tab**: Interactive exploration by donor/storage factors
4. **Descriptive Statistics Tab**: Demographics and distribution charts

---

## Executive Summary

This roadmap details the migration of a monolithic vanilla JavaScript dashboard (6,674 lines across 7 modules) to a modern React + TypeScript architecture. The goal is to preserve the existing visual design and scientific accuracy while eliminating architectural debt.

### Current State
- Vanilla JS with string-concatenated HTML
- State scattered across multiple modules with desync issues
- Tight DOM coupling via hardcoded element IDs
- Chart.js instances leaking memory
- ~6,700 lines of JS, ~1,700 lines of CSS
- 60+ CSV data files (~120MB)

### Target State
- React 18 + TypeScript + Vite
- Centralized state via Zustand
- Component-based architecture with proper lifecycle management
- Type-safe data layer with caching
- Responsive CSS Grid layout
- Static deployment ready

---

## Architecture Decisions (ADRs)

### ADR-001: Build Tooling
**Decision**: Vite + React + TypeScript
**Rationale**: Fast HMR, native ESM, excellent TypeScript support, minimal config
**Alternatives Rejected**: Create React App (slow, deprecated), Next.js (overkill for static SPA)

### ADR-002: State Management
**Decision**: Zustand
**Rationale**: Minimal boilerplate (~1KB), React-native, no providers required, excellent TypeScript support
**Alternatives Rejected**: Redux (too heavy), Jotai (atomic model unnecessary), React Context alone (prop drilling for this complexity)

### ADR-003: Styling Approach
**Decision**: CSS Modules + preserved CSS custom properties
**Rationale**: Preserves existing design system, scoped styles, no runtime cost
**Alternatives Rejected**: Tailwind (would require redesign), styled-components (runtime overhead)

### ADR-004: Data Layer
**Decision**: Keep CSV files, add client-side caching layer with optional build-time JSON conversion
**Rationale**: Existing data pipeline works, JSON parsing is faster, backward compatible
**Alternatives Rejected**: API server (unnecessary complexity), IndexedDB (overkill)

### ADR-005: Chart Library
**Decision**: Keep Chart.js 3.x with React wrapper
**Rationale**: Existing configurations work, avoid rewriting chart logic
**Alternatives Rejected**: Recharts (less flexible), D3 (higher complexity), Chart.js 4.x (breaking changes)

---

## Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHASE DEPENDENCY GRAPH                             │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: Foundation          PHASE 2: Data Layer         PHASE 3: State
┌─────────────────┐          ┌─────────────────┐         ┌─────────────────┐
│ T-001: Scaffold │─────────►│ T-003: Types    │────────►│ T-005: Store    │
│ T-002: Design   │          │ T-004: Service  │         └────────┬────────┘
│       Tokens    │          └─────────────────┘                  │
└─────────────────┘                                               │
        │                                                         │
        └──────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
PHASE 4: Core Components      (can run in parallel after Phase 3)
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ T-006: Layout   │  │ T-007: Chart    │  │ T-008: Controls │
│       Shell     │  │       Base      │  │                 │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
PHASE 5: Tab Implementations  (can run in parallel after Phase 4)
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ T-009: Main     │  │ T-010: RBC      │  │ T-011: Comp     │  │ T-012: Desc     │
│     Findings    │  │   Transfusions  │  │    Factor FX    │  │      Stats      │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
                              │
                              ▼
PHASE 6: Polish & Deploy
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ T-013: Responsive│  │ T-014: Perf    │  │ T-015: Deploy   │
│       & A11y    │  │   Optimization  │  │      Config     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Phase 1: Foundation

**Goal**: Establish project scaffold and design system
**Duration**: 1 day
**Parallel Work**: T-001 and T-002 can run in parallel

| Ticket | Title | Depends On | Blocking |
|--------|-------|------------|----------|
| T-001 | Project Scaffold & Tooling | None | T-003, T-006 |
| T-002 | Design Token Migration | None | T-006, T-007, T-008 |

---

## Phase 2: Data Layer

**Goal**: Type-safe data loading with caching
**Duration**: 1 day
**Parallel Work**: T-003 and T-004 are sequential (types first)

| Ticket | Title | Depends On | Blocking |
|--------|-------|------------|----------|
| T-003 | TypeScript Type Definitions | T-001 | T-004, T-005 |
| T-004 | Data Service Implementation | T-003 | T-009, T-010, T-011, T-012 |

---

## Phase 3: State Management

**Goal**: Single source of truth for application state
**Duration**: 0.5 days

| Ticket | Title | Depends On | Blocking |
|--------|-------|------------|----------|
| T-005 | Zustand Store Implementation | T-003 | T-006, T-007, T-008 |

---

## Phase 4: Core Components

**Goal**: Reusable UI primitives
**Duration**: 2 days
**Parallel Work**: T-006, T-007, T-008 can all run in parallel

| Ticket | Title | Depends On | Blocking |
|--------|-------|------------|----------|
| T-006 | Layout Shell Components | T-001, T-002, T-005 | T-009, T-010, T-011, T-012 |
| T-007 | Base Chart Component | T-002, T-005 | T-009, T-010, T-011, T-012 |
| T-008 | Control Components | T-002, T-005 | T-009, T-010, T-011, T-012 |

---

## Phase 5: Tab Implementations

**Goal**: Port all four dashboard tabs
**Duration**: 3 days
**Parallel Work**: All four tickets can run in parallel

| Ticket | Title | Depends On | Blocking |
|--------|-------|------------|----------|
| T-009 | Main Findings Tab | T-004, T-006, T-007 | T-013 |
| T-010 | RBC Transfusions Tab | T-004, T-006, T-007, T-008 | T-013 |
| T-011 | Component Factor Effects Tab | T-004, T-006, T-007, T-008 | T-013 |
| T-012 | Descriptive Statistics Tab | T-004, T-006, T-007 | T-013 |

---

## Phase 6: Polish & Deploy

**Goal**: Production readiness
**Duration**: 1-2 days
**Parallel Work**: T-013 and T-014 can run in parallel; T-015 depends on both

| Ticket | Title | Depends On | Blocking |
|--------|-------|------------|----------|
| T-013 | Responsive Layout & Accessibility | T-009, T-010, T-011, T-012 | T-015 |
| T-014 | Performance Optimization | T-009, T-010, T-011, T-012 | T-015 |
| T-015 | Deployment Configuration | T-013, T-014 | None |

---

## Quick Start Guide

### Prerequisites
- Node.js 18+ (recommend 20 LTS)
- npm 9+ or yarn/pnpm
- Git
- A modern IDE (VS Code recommended with ESLint + Prettier extensions)

### Initial Setup (Before Phase 1)

```bash
# 1. Create project directory
mkdir scandat-dashboard-new
cd scandat-dashboard-new

# 2. Copy CSV data files from legacy project
mkdir -p public/data
cp -r /path/to/legacy/data/* public/data/

# 3. Verify data files exist
ls public/data/
# Should see: viz_index.csv, VIZ_*.csv files, *_distribution.csv files
```

### Executing Tickets

Each ticket should be executed in order (respecting dependencies). For each ticket:

1. **Read the full ticket** in `/tickets/T-XXX-*.md`
2. **Check dependencies** are complete
3. **Implement** following the code snippets provided
4. **Verify** all acceptance criteria pass
5. **Mark complete** before moving to next ticket

### Verification Commands

```bash
# After T-001: Scaffold should work
npm run dev      # Should open http://localhost:3000
npm run build    # Should complete without errors
npm run lint     # Should pass
npm run typecheck # Should pass

# After T-006: Layout should render
# Visit http://localhost:3000 - should see header, tabs, empty content

# After Phase 5: Full functionality
# All four tabs should work with real data

# After T-015: Production ready
npm run build && npm run preview
# Run Lighthouse audit - should score 90+
```

### Critical Files Checklist

After all tickets complete, verify these files exist:

```
✓ src/main.tsx
✓ src/App.tsx
✓ src/stores/dashboardStore.ts
✓ src/services/dataService.ts
✓ src/types/index.ts
✓ src/styles/tokens.css
✓ src/styles/global.css
✓ src/components/layout/Layout.tsx
✓ src/components/charts/BaseChart.tsx
✓ src/components/controls/index.ts
✓ src/components/tabs/MainFindings/index.tsx
✓ src/components/tabs/RBCTransfusions/index.tsx
✓ src/components/tabs/ComponentFactorEffects/index.tsx
✓ src/components/tabs/DescriptiveStatistics/index.tsx
✓ vite.config.ts
✓ tsconfig.json
✓ package.json
```

---

## Success Criteria

### Functional Requirements
- [ ] All four tabs render correctly with existing CSV data
- [ ] Theme toggle (dark/light) works across all components
- [ ] Chart interactions (zoom, hover, comparison selection) preserved
- [ ] SVG export functionality works
- [ ] Time range controls function correctly
- [ ] Multi-vital parameter selection works in RBC Transfusions tab

### Non-Functional Requirements
- [ ] Initial load under 3 seconds on 3G
- [ ] Lighthouse performance score > 90
- [ ] No memory leaks from chart instances
- [ ] TypeScript strict mode with no `any` escape hatches
- [ ] All components render correctly at 320px-2560px widths

### Code Quality
- [ ] Zero ESLint errors
- [ ] All public functions documented with JSDoc
- [ ] Component props typed with interfaces (not inline)
- [ ] No hardcoded DOM IDs in components

---

## File Structure (Target)

```
scandat-dashboard/
├── public/
│   └── data/                    # CSV files (copied from legacy)
│       ├── viz_index.csv
│       ├── VIZ_*.csv
│       └── *_distribution.csv
│
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── TabNavigation.tsx
│   │   │   ├── TabPanel.tsx
│   │   │   └── Layout.module.css
│   │   │
│   │   ├── charts/
│   │   │   ├── BaseChart.tsx
│   │   │   ├── TransfusionEffectChart.tsx
│   │   │   ├── LoessChart.tsx
│   │   │   ├── ComponentFactorChart.tsx
│   │   │   ├── DescriptiveChart.tsx
│   │   │   └── plugins/
│   │   │       └── verticalLinePlugin.ts
│   │   │
│   │   ├── controls/
│   │   │   ├── VitalParamSelector.tsx
│   │   │   ├── CompFactorSelector.tsx
│   │   │   ├── TimeRangeSlider.tsx
│   │   │   ├── ComparisonTags.tsx
│   │   │   ├── DisplayOptions.tsx
│   │   │   └── Controls.module.css
│   │   │
│   │   └── tabs/
│   │       ├── MainFindings/
│   │       │   ├── index.tsx
│   │       │   ├── SummaryTable.tsx
│   │       │   ├── ComponentFactorsGrid.tsx
│   │       │   └── MainFindings.module.css
│   │       │
│   │       ├── RBCTransfusions/
│   │       │   ├── index.tsx
│   │       │   ├── PlotPair.tsx
│   │       │   └── RBCTransfusions.module.css
│   │       │
│   │       ├── ComponentFactorEffects/
│   │       │   ├── index.tsx
│   │       │   └── ComponentFactorEffects.module.css
│   │       │
│   │       └── DescriptiveStatistics/
│   │           ├── index.tsx
│   │           ├── PatientStats.tsx
│   │           ├── DonorStats.tsx
│   │           ├── StorageStats.tsx
│   │           └── DescriptiveStatistics.module.css
│   │
│   ├── hooks/
│   │   ├── useCSVData.ts
│   │   ├── useChartTheme.ts
│   │   └── useTimeRange.ts
│   │
│   ├── stores/
│   │   └── dashboardStore.ts
│   │
│   ├── services/
│   │   ├── dataService.ts
│   │   └── csvParser.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── vitals.ts
│   │   ├── factors.ts
│   │   └── charts.ts
│   │
│   └── styles/
│       ├── tokens.css           # CSS custom properties
│       ├── reset.css            # Minimal reset
│       └── global.css           # Global styles
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Reference: Legacy Module Mapping

| Legacy Module | Lines | Maps To (New) |
|---------------|-------|---------------|
| dashboard.js | 798 | `stores/dashboardStore.ts`, `App.tsx`, `tabs/ComponentFactorEffects/` |
| utils.js | 487 | `services/dataService.ts`, `hooks/useChartTheme.ts` |
| visualization.js | 946 | `components/charts/BaseChart.tsx`, `components/charts/ComponentFactorChart.tsx` |
| descriptiveStats.js | 2,167 | `tabs/DescriptiveStatistics/*` |
| transfusions.js | 1,208 | `tabs/RBCTransfusions/*` |
| componentFactors.js | 773 | `tabs/MainFindings/ComponentFactorsGrid.tsx` |
| mainFindings.js | 295 | `tabs/MainFindings/*` |
| styles.css | 1,385 | `styles/tokens.css`, component CSS modules |
| componentFactors.css | 353 | `tabs/MainFindings/MainFindings.module.css` |

---

## Reference: Data Schema

### Vital Parameters (7 total)
| Code | Name | Unit | Display Name |
|------|------|------|--------------|
| ARTm | Mean Arterial Pressure | mmHg | MAP |
| ARTs | Systolic Blood Pressure | mmHg | SBP |
| ARTd | Diastolic Blood Pressure | mmHg | DBP |
| HR | Heart Rate | bpm | HR |
| FIO2 | Fraction of Inspired Oxygen | % | FiO2 |
| SPO2 | Peripheral Capillary O2 Saturation | % | SpO2 |
| VE | Minute Ventilation | L/min | VE |

### Component Factors (5 total)
| Code | Name | Categories |
|------|------|------------|
| DonorHb_Cat | Donor Hemoglobin | <125, 125-139, 140-154, 155-169, ≥170 g/L |
| Storage_Cat | RBC Storage Time | <10, 10-19, 20-29, 30-39, ≥40 days |
| DonorSex | Donor Sex | Male, Female |
| DonorParity | Donor Parity | Nulliparous, Parous |
| wdy_donation | Weekday of Donation | Sunday–Saturday |

### CSV File Naming Convention
- `VIZ_{VITAL}_{FACTOR}.csv` — Visualization data (35 files)
- `VIZ_{VITAL}_TRANSFUSION.csv` — Transfusion effect data (7 files)
- `VIZ_LOESS.csv` — LOESS smoothing data
- `viz_index.csv` — Index of all visualization files
- `*_distribution.csv` — Descriptive statistics

### Key Data Columns
```
TimeFromTransfusion: Minutes relative to transfusion (t=0)
PredVal_Base: Base model prediction
PredVal_Full: Fully adjusted model prediction
StdErrVal_*: Standard error
Lower_Full, Upper_Full: 95% CI bounds
Delta_*: Change from baseline
```

---

## Reference: Design System

### Colors
```css
/* Brand */
--color-accent-highlight: #E82127;  /* SCANDAT Red */

/* Chart Palette (8 colors) */
#635BFF, #E82127, #10B981, #F59E0B, #0A84FF, #8B5CF6, #EC4899, #06B6D4

/* Dark Theme Backgrounds */
--color-bg-main: #0a0a0a;
--color-bg-card: #141414;
--color-bg-elevated: #1a1a1a;

/* Light Theme Backgrounds */
--color-bg-main: #f8f9fa;
--color-bg-card: #ffffff;
```

### Typography
```css
--font-heading: 'Montserrat', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'Roboto Mono', monospace;
```

### Key Measurements
```css
--chart-max-width: 1056px;
--chart-height-md: 400px;
--sidebar-width: 280px-320px;
```

---

## Reference: Ticket Index

| Ticket | Title | Phase | Effort | Dependencies |
|--------|-------|-------|--------|--------------|
| T-001 | Project Scaffold & Tooling | 1 | 2-3h | None |
| T-002 | Design Token Migration | 1 | 2-3h | None |
| T-003 | TypeScript Type Definitions | 2 | 2-3h | T-001 |
| T-004 | Data Service Implementation | 2 | 3-4h | T-003 |
| T-005 | Zustand Store Implementation | 3 | 2-3h | T-003 |
| T-006 | Layout Shell Components | 4 | 3-4h | T-001, T-002, T-005 |
| T-007 | Base Chart Component | 4 | 4-5h | T-002, T-005 |
| T-008 | Control Components | 4 | 3-4h | T-002, T-005 |
| T-009 | Main Findings Tab | 5 | 4-5h | T-004, T-006, T-007 |
| T-010 | RBC Transfusions Tab | 5 | 4-5h | T-004, T-006, T-007, T-008 |
| T-011 | Component Factor Effects Tab | 5 | 5-6h | T-004, T-006, T-007, T-008 |
| T-012 | Descriptive Statistics Tab | 5 | 4-5h | T-004, T-006, T-007 |
| T-013 | Responsive Layout & Accessibility | 6 | 3-4h | T-009, T-010, T-011, T-012 |
| T-014 | Performance Optimization | 6 | 3-4h | T-009, T-010, T-011, T-012 |
| T-015 | Deployment Configuration | 6 | 2-3h | T-013, T-014 |
| T-016 | Testing Setup & Critical Tests | 2 | 3-4h | T-001 |

**Total Estimated Effort**: 48-62 hours (8-12 days with 1 agent, 3-4 days with parallel agents)

---

## Notes for Agents

1. **Always reference `architecture.md`** — The legacy architecture document contains critical implementation details including CSV schemas, Chart.js configurations, and state management patterns.

2. **Preserve scientific accuracy** — This visualizes peer-reviewed research. Do not change chart calculations, axis labels, or data transformations without explicit instruction.

3. **Test with real data** — All implementations must be tested against the actual CSV files in `/data/`. Sample data is insufficient.

4. **Maintain visual parity** — The aesthetic (colors, typography, spacing) must match the legacy implementation. Reference the CSS custom properties in `styles.css`.

5. **Document decisions** — If you make architectural choices not covered here, document them in code comments with rationale.

---

*Roadmap Version: 1.0*
*Last Updated: December 2024*