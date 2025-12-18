# Architecture

Technical documentation for the SCANDAT ICU Transfusion Dashboard.

## Overview

A React single-page application for visualizing peer-reviewed research findings on RBC transfusions in ICU patients. The dashboard displays statistical analyses of how transfusions affect patient vital signs, with breakdowns by donor and storage characteristics.

**Study Data:**
- 6,736 unique ICU patients
- 14,655 RBC transfusions
- Four Stockholm-region hospitals (Jan 2014 - Nov 2018)

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build Tool | Vite 5 |
| State Management | Zustand 4 |
| Charts | Chart.js 4 + react-chartjs-2 |
| Data Parsing | PapaParse |
| Testing | Vitest + React Testing Library |

## Project Structure

```
src/
├── components/
│   ├── charts/          # Chart.js wrapper and utilities
│   ├── controls/        # UI controls (selectors, sliders, buttons)
│   ├── layout/          # App shell (Header, Layout, TabPanel)
│   ├── tabs/            # Tab page implementations
│   │   ├── Overview/
│   │   ├── DescriptiveStatistics/
│   │   ├── MainFindings/
│   │   ├── RBCTransfusions/
│   │   └── ComponentFactorEffects/
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
├── services/            # Data loading and caching
├── stores/              # Zustand state management
├── types/               # TypeScript type definitions
└── styles/              # Global CSS and design tokens

public/
└── data/                # CSV data files (served statically)
```

## Architecture Patterns

### Component Architecture

The app uses a tab-based layout with lazy-loaded tab components:

```
App
├── GlossaryProvider (context)
└── Layout
    ├── Header
    ├── TabNavigation
    └── TabPanel (x5)
        └── Suspense + ErrorBoundary
            └── [Tab Component]
```

### State Management

Zustand store with persist middleware manages:
- Theme preference (dark/light)
- Active tab navigation
- Chart display options (CI, base model, delta plot)
- Selected vital parameters and component factors
- Time range filters

### Data Flow

```
CSV Files (public/data/)
    ↓
dataService.ts (fetch + parse)
    ↓
cache.ts (in-memory caching)
    ↓
React Components (via hooks)
    ↓
Chart.js (visualization)
```

## Data Architecture

### CSV File Categories

| Category | Pattern | Count |
|----------|---------|-------|
| Visualization | `VIZ_{VITAL}_{FACTOR}.csv` | 42 |
| LOESS Analysis | `VIZ_LOESS*.csv` | 2 |
| Summary Tables | `*_summary.csv` | 4 |
| Descriptive Stats | `*_distribution.csv` | 11 |

### Vital Parameters

| Code | Description |
|------|-------------|
| HR | Heart Rate |
| SPO2 | Oxygen Saturation |
| FIO2 | Fraction of Inspired O2 |
| VE | Minute Ventilation |
| ARTS | Systolic Blood Pressure |
| ARTM | Mean Arterial Pressure |
| ARTD | Diastolic Blood Pressure |

### Component Factors

| Code | Description |
|------|-------------|
| STORAGE_CAT | RBC Storage Duration |
| TRANSFUSION | Transfusion Effect |
| DONORSEX | Donor Sex |
| DONORPARITY | Donor Parity |
| DONORHB_CAT | Donor Hemoglobin |
| WDY_DONATION | Weekday of Donation |

## Build & Development

```bash
npm run dev       # Development server (port 3000)
npm run build     # Production build
npm run preview   # Preview production build
npm run test      # Run tests
npm run lint      # ESLint check
```

### Build Output

Vite produces optimized chunks:
- `vendor-react` - React runtime
- `vendor-charts` - Chart.js
- `vendor-data` - PapaParse, Lodash
- `vendor-state` - Zustand

## Deployment

Configured for:
- GitHub Pages (via GitHub Actions)
- Netlify
- Vercel

The `VITE_BASE_PATH` environment variable configures the base URL for GitHub Pages deployment.
