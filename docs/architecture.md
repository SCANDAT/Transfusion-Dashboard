# SCANDAT ICU Transfusion Dashboard - Complete Architectural Documentation

> **Generated**: December 2024
> **Version**: 2.0
> **Status**: Comprehensive architectural mapping of legacy monolithic codebase

---

## Executive Summary

The **SCANDAT ICU Transfusion Dashboard** is a client-side Single Page Application (SPA) for visualizing peer-reviewed scientific findings about RBC transfusions in ICU patients across four Stockholm-region hospitals (January 2014 - November 2018).

**Study Population:**
- 6,736 unique ICU patients
- 14,655 RBC transfusions administered

**Key Architectural Characteristics:**
| Aspect | Details |
|--------|---------|
| Architecture | Monolithic, Client-Side SPA |
| Tech Stack | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| Libraries | Chart.js 3.9.1, PapaParse 5.3.2, Lodash 4.17.21, FileSaver.js 2.0.5 |
| Backend | Minimal Python static file server (`serve.py`) with CORS support |
| Data Source | 60+ static CSV files served from `/data` directory |
| Database | None - all data pre-computed |

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Project Structure](#2-project-structure)
3. [Module Architecture](#3-module-architecture)
4. [Complete Call Stack Traces](#4-complete-call-stack-traces)
5. [UI Component Hierarchy](#5-ui-component-hierarchy)
6. [Data Architecture](#6-data-architecture)
7. [State Management](#7-state-management)
8. [User Interaction Flows](#8-user-interaction-flows)
9. [Theming System](#9-theming-system)
10. [Dependencies](#10-dependencies)
11. [Known Issues & Technical Debt](#11-known-issues--technical-debt)
12. [Operational Guide](#12-operational-guide)

---

## 1. System Architecture

### 1.1 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         index.html (Entry Point)                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ Theme Toggle │  │ Loading      │  │ App Container│  │ CDN Libs    │ │ │
│  │  │ SVG Export   │  │ Indicator    │  │              │  │             │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    TransfusionDashboard (Orchestrator)                  │ │
│  │                         js/dashboard.js                                 │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │ State: fileCase, selectedVital, selectedCompFactor, timeRange,   │  │ │
│  │  │        showCI, showBaseModel, showDeltaPlot, statsData, charts   │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────┬─────────────────────────────────────────┘ │
│                                 │                                            │
│         ┌───────────────────────┼───────────────────────┐                   │
│         │                       │                       │                    │
│         ▼                       ▼                       ▼                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Main Findings   │  │ Component       │  │ RBC             │              │
│  │ mainFindings.js │  │ Factor Effects  │  │ Transfusions    │              │
│  │                 │  │ visualization.js│  │ transfusions.js │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
│           ▼                    │                    │                        │
│  ┌─────────────────┐           │                    │                        │
│  │ Component       │           │                    │                        │
│  │ Factors Table   │           │                    │                        │
│  │componentFactors │           │                    │                        │
│  └─────────────────┘           │                    │                        │
│                                │                    │                        │
│  ┌─────────────────┐           │                    │                        │
│  │ Descriptive     │           │                    │                        │
│  │ Statistics      │           │                    │                        │
│  │descriptiveStats │           │                    │                        │
│  └─────────────────┘           │                    │                        │
│                                │                    │                        │
│         ┌──────────────────────┴────────────────────┘                       │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         Shared Services                                  ││
│  │  ┌─────────────────────────┐  ┌─────────────────────────────────────┐   ││
│  │  │ utils.js                │  │ External Libraries (CDN)            │   ││
│  │  │ - safeFetch()           │  │ - Chart.js 3.9.1                    │   ││
│  │  │ - openTab()             │  │ - PapaParse 5.3.2                   │   ││
│  │  │ - formatNumber()        │  │ - Lodash 4.17.21                    │   ││
│  │  │ - toggleTheme()         │  │ - FileSaver.js 2.0.5                │   ││
│  │  │ - exportChartAsSVG()    │  │                                     │   ││
│  │  │ - logDebug()            │  │                                     │   ││
│  │  └─────────────────────────┘  └─────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP Fetch (CSV)
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Python Static Server (serve.py:8000)                      │
│                         CORS: Access-Control-Allow-Origin: *                 │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              /data/ Directory                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                  │
│  │ Descriptive    │  │ Visualization  │  │ Summary        │                  │
│  │ Statistics     │  │ Data (35+)     │  │ Tables         │                  │
│  │ (11 files)     │  │ VIZ_*.csv      │  │ (4 files)      │                  │
│  └────────────────┘  └────────────────┘  └────────────────┘                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW PIPELINE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

UPSTREAM (Pre-computed):
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Raw Transfusion │ -> │ SAS Statistical │ -> │ CSV Files       │
│ Database        │    │ Analysis        │    │ (60+ files)     │
│ (External)      │    │ PROC MIXED      │    │ Pre-computed    │
└─────────────────┘    └─────────────────┘    └─────────────────┘

RUNTIME (Browser):
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ User Selection  │ -> │ safeFetch()     │ -> │ PapaParse       │
│ (Dropdown/Btn)  │    │ HTTP GET        │    │ CSV -> Array    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                                                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Chart.js        │ <- │ prepareChart    │ <- │ Lodash          │
│ Canvas Render   │    │ Data()          │    │ groupBy/sortBy  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 2. Project Structure

```
W:\Transfusion-Dashboard/
│
├── index.html                    # Entry point - loads all modules, theme logic
├── serve.py                      # Python dev server with CORS (port 8000)
│
├── css/
│   ├── styles.css               # (32 KB) Main design system, dark/light themes
│   └── componentFactors.css     # (7.8 KB) Component factor grid styling
│
├── js/
│   ├── utils.js                 # (487 lines) Core utilities, CSV loading
│   ├── dashboard.js             # (798 lines) Main orchestrator class
│   ├── visualization.js         # (946 lines) Chart rendering engine
│   ├── componentFactors.js      # (773 lines) Table 2b small multiples
│   ├── transfusions.js          # (1,208 lines) RBC transfusions tab
│   ├── mainFindings.js          # (295 lines) Summary tables
│   └── descriptiveStats.js      # (2,167 lines) Demographics charts
│
├── data/                        # 60+ CSV files (~120 MB total)
│   ├── viz_index.csv            # Master index: vital/factor mappings
│   ├── VIZ_*.csv                # 35 visualization data files
│   ├── *_summary.csv            # 4 summary data files
│   └── *_distribution.csv       # 11 descriptive statistics files
│
├── docs/
│   └── architecture.md          # This document
│
├── analysis/
│   └── 1 - Descriptive Statistics.sas  # Upstream SAS analysis
│
├── Archive/                     # Historical versions
│   └── index*.html              # v1-v8, experimental versions
│
└── memory-bank/                 # Development documentation
    ├── projectbrief.md
    ├── techContext.md
    ├── systemPatterns.md
    └── ...
```

### 2.1 File Size Summary

| File | Lines | Size | Purpose |
|------|-------|------|---------|
| dashboard.js | 798 | 31 KB | Main orchestrator |
| descriptiveStats.js | 2,167 | 81 KB | Demographics |
| transfusions.js | 1,208 | 42 KB | Transfusion effects |
| visualization.js | 946 | 38 KB | Chart rendering |
| componentFactors.js | 773 | 27 KB | Small multiples |
| mainFindings.js | 295 | 11 KB | Summary tables |
| utils.js | 487 | 17 KB | Utilities |
| **Total JS** | **6,674** | **247 KB** | |
| styles.css | ~1,385 | 32 KB | Main styles |
| componentFactors.css | ~353 | 7.8 KB | Factor styles |
| **Total CSS** | **~1,738** | **~40 KB** | |

---

## 3. Module Architecture

### 3.1 Module Dependency Graph

```
                         index.html (Entry)
                              │
                              │ window.onload
                              ▼
                    ┌─────────────────────┐
                    │    dashboard.js     │
                    │   (Orchestrator)    │
                    └──────────┬──────────┘
                               │
        ┌──────────┬───────────┼───────────┬──────────┐
        │          │           │           │          │
        ▼          ▼           ▼           ▼          ▼
   ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌────────────┐
   │mainFind│ │compFact│ │visualiz- │ │transfu-│ │descriptive │
   │ings.js │ │ors.js  │ │ation.js  │ │sions.js│ │Stats.js    │
   └───┬────┘ └───┬────┘ └────┬─────┘ └───┬────┘ └─────┬──────┘
       │          │           │           │            │
       └──────────┴───────────┴─────┬─────┴────────────┘
                                    │
                              ┌─────┴─────┐
                              │  utils.js │
                              │ (Shared)  │
                              └─────┬─────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
        ┌──────────┐         ┌──────────┐         ┌──────────┐
        │ Chart.js │         │ PapaParse│         │  Lodash  │
        │  (CDN)   │         │  (CDN)   │         │  (CDN)   │
        └──────────┘         └──────────┘         └──────────┘
```

### 3.2 Module Responsibilities

| Module | Lines | Primary Responsibility | Secondary Responsibilities |
|--------|-------|----------------------|---------------------------|
| **dashboard.js** | 798 | Application orchestration | UI creation, state management, Component Factor Effects tab |
| **utils.js** | 487 | Shared utilities | CSV loading, formatting, theme, debug, export |
| **visualization.js** | 946 | Chart rendering engine | Data preparation, Chart.js configuration |
| **descriptiveStats.js** | 2,167 | Demographics tab | 11 CSV loaders, chart initialization |
| **transfusions.js** | 1,208 | RBC Transfusions tab | Plot pairs, LOESS analysis |
| **componentFactors.js** | 773 | Table 2b (Small Multiples) | Factor grid rendering |
| **mainFindings.js** | 295 | Main Findings tab | Summary tables |

### 3.3 Inter-Module Function Calls

| From | To | Functions Called |
|------|----|--------------------|
| dashboard.js | utils.js | `safeFetch`, `showError`, `showLoading`, `hideLoading`, `logDebug`, `toggleTheme`, `applyTheme`, `openTab` |
| dashboard.js | visualization.js | `loadVisualizationData`, `prepareChartData`, `renderChart`, `createComparisonTags`, `createVisualizationControls`, `createChartArea` |
| dashboard.js | descriptiveStats.js | `createDescriptiveStatsContent`, `initializeDescriptiveStatsCharts`, all `load*` functions |
| dashboard.js | mainFindings.js | `initializeMainFindings` |
| dashboard.js | componentFactors.js | `initializeRbcComponentFactors` |
| dashboard.js | transfusions.js | `initializeRbcTransfusions` |
| mainFindings.js | componentFactors.js | `createComponentFactorsTable`, `loadFactorObservedDataSummary`, `loadFactorModelBasedSummary` |
| transfusions.js | visualization.js | `prepareTransfusionChartData`, `renderChart` |
| All modules | utils.js | `safeFetch`, `logDebug`, `showError` |

---

## 4. Complete Call Stack Traces

### 4.1 Application Initialization

```
index.html: window.addEventListener('load')
  │
  └─► new TransfusionDashboard('app-container')
      │
      ├─► applyTheme()                          // utils.js
      │
      └─► TransfusionDashboard.initialize()
          │
          ├─► createUI()
          │   ├─► createVisualizationControls()  // visualization.js
          │   ├─► createChartArea()              // visualization.js
          │   ├─► createRbcTransfusionsContent()
          │   ├─► initializeMainFindings()       // mainFindings.js
          │   │   ├─► loadObservedDataSummary()
          │   │   │   └─► safeFetch('observed_data_summary')
          │   │   ├─► loadModelBasedSummary()
          │   │   │   └─► safeFetch('model_based_summary')
          │   │   ├─► loadFactorObservedDataSummary()  // componentFactors.js
          │   │   ├─► loadFactorModelBasedSummary()    // componentFactors.js
          │   │   └─► createMainFindingsContent()
          │   │       └─► createComponentFactorsTable()
          │   │
          │   ├─► initializeRbcComponentFactors()     // componentFactors.js
          │   └─► initializeRbcTransfusions()         // transfusions.js
          │       ├─► createVitalParamButtons()
          │       ├─► addEventListeners()
          │       └─► loadVitalParameterData('ARTm')
          │           ├─► loadTransfusionData()
          │           │   └─► safeFetch('VIZ_ARTm_TRANSFUSION')
          │           ├─► createOrUpdatePlotPair()
          │           └─► loadLoessData()
          │               └─► safeFetch('VIZ_LOESS')
          │
          ├─► loadDescriptiveStats()                   // Parallel Promise.all
          │   ├─► loadPatientSexDistribution()
          │   ├─► loadPatientAgeStats()
          │   ├─► loadPatientAgeGroups()
          │   ├─► loadRbcUnitsPerPatient()
          │   ├─► loadUniquePatientsCount()
          │   ├─► loadTotalTransfusedUnits()
          │   ├─► loadDonorhbDistribution()
          │   ├─► loadStorageDistribution()
          │   ├─► loadDonorSexDistribution()
          │   ├─► loadDonorParityDistribution()
          │   └─► loadDonationWeekdayDistribution()
          │
          ├─► updateDescriptiveStatsContent()
          │   ├─► createDescriptiveStatsContent()
          │   └─► initializeDescriptiveStatsCharts()
          │       ├─► initializeChartToggle() x8
          │       └─► setupExpandAllButton()
          │
          ├─► addEventListeners()
          │   └─► [Setup all dropdown/checkbox listeners]
          │
          └─► loadIndexData()
              ├─► safeFetch('viz_index')
              ├─► Papa.parse()
              ├─► updateVitalSelect()
              └─► updateCompFactors()
                  └─► loadVisualizationData()
```

### 4.2 Component Factor Effects Tab (Main Interactive Chart)

```
User selects Vital Parameter from dropdown
  │
  └─► dashboard.js: document.getElementById('vital-select').addEventListener('change')
      │
      └─► updateCompFactors()
          │
          ├─► updateCompFactorSelect()
          │
          └─► loadVisualizationData()                    // dashboard.js
              │
              └─► visualization.js: loadVisualizationData(selectedVital, selectedCompFactor, fileCase, logDebug)
                  │
                  ├─► safeFetch(baseFileName)             // utils.js
                  │   └─► fetch() -> Papa.parse()
                  │
                  ├─► [Extract metadata from Row 0]
                  │   - VitalName, CompName, YLabel, DeltaYLabel
                  │
                  ├─► [Identify comparison column dynamically]
                  │   - DonorHb_Cat | Storage_Cat | DonorSex | DonorParity | wdy_donation
                  │
                  └─► [Get unique comparison values]
                      │
                      └─► Return: { data, comparisonColumn, comparisonValues, metaInfo }
              │
              ├─► createComparisonTags()                  // visualization.js
              │
              └─► updateChart()                           // dashboard.js
                  │
                  ├─► prepareChartData()                  // visualization.js
                  │   ├─► Filter by timeRange
                  │   ├─► Filter by selectedComparisons
                  │   ├─► _.groupBy(data, comparisonColumn)
                  │   ├─► Select value fields (Delta vs Absolute)
                  │   ├─► Build CI datasets if enabled
                  │   └─► Return Chart.js dataset structure
                  │
                  └─► renderChart()                       // visualization.js
                      ├─► Destroy existing chart if any
                      ├─► Configure Chart.js options
                      │   ├─► Responsive sizing
                      │   ├─► Theme-aware colors
                      │   ├─► Vertical zero line plugin
                      │   └─► Custom legend labels
                      └─► new Chart(ctx, config)
```

### 4.3 RBC Transfusions Tab

```
User clicks Vital Parameter button (e.g., "MAP")
  │
  └─► transfusions.js: vitalParamBtn.addEventListener('click')
      │
      └─► toggleVitalParameter(state, vitalParam)
          │
          ├─► IF adding parameter:
          │   │
          │   └─► loadVitalParameterData(state, vitalParam)
          │       │
          │       ├─► loadTransfusionData(vitalParam, fileCase, logDebug)
          │       │   └─► safeFetch('VIZ_{VITAL}_TRANSFUSION')
          │       │       └─► Papa.parse() -> resolve(data)
          │       │
          │       ├─► createOrUpdatePlotPair(state, vitalParam, data)
          │       │   ├─► Create plot pair DOM structure
          │       │   ├─► prepareTransfusionChartData()
          │       │   └─► renderChart() for transfusion effect
          │       │
          │       └─► loadLoessData(vitalParam, fileCase, logDebug)
          │           └─► safeFetch('VIZ_LOESS') -> filter by vital
          │               └─► updateLoessPlot()
          │                   └─► renderChart() for LOESS
          │
          └─► IF removing parameter:
              └─► removeVitalParameterPlot()
                  ├─► Destroy Chart.js instances
                  └─► Remove DOM elements
```

### 4.4 Theme Toggle

```
User clicks theme toggle button
  │
  └─► index.html: document.getElementById('theme-toggle').addEventListener('click')
      │
      └─► toggleTheme()                                   // utils.js
          │
          ├─► Toggle 'light-theme' class on body
          │
          ├─► localStorage.setItem('theme', 'light' | 'dark')
          │
          └─► document.dispatchEvent(new CustomEvent('themeChanged'))
              │
              ├─► dashboard.js: handleThemeChange()
              │   └─► updateChart()
              │
              └─► transfusions.js: document.addEventListener('themeChanged')
                  └─► updateAllCharts(state)
```

### 4.5 SVG Export

```
User clicks Export SVG button
  │
  └─► dashboard.js: document.getElementById('export-svg-btn').addEventListener('click')
      │
      └─► exportChartAsSVG(chart, filename)               // utils.js
          │
          ├─► Check if dark mode -> switch to light theme temporarily
          │
          ├─► doExport()
          │   ├─► chart.toBase64Image()
          │   ├─► Create SVG wrapper
          │   ├─► XMLSerializer.serializeToString(svg)
          │   └─► saveAs(svgBlob, filename)               // FileSaver.js
          │
          └─► If was dark mode -> switch back
```

---

## 5. UI Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TransfusionDashboard (Root)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Header                                                                  │ │
│  │  ├── Title: "SCANDAT ICU Transfusion Data Dashboard"                   │ │
│  │  └── Theme Toggle Button (☀/☾)                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Tab Navigation (Horizontal Scroll)                                      │ │
│  │  ├── [Main Findings]                                                    │ │
│  │  ├── [RBC Transfusion Effects]                                          │ │
│  │  ├── [Component Factor Effects]                                         │ │
│  │  └── [Descriptive Statistics]                                           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ TAB 1: Main Findings (#main-findings-tab)                               │ │
│  │  ├── Summary Table (Table 2a)                                           │ │
│  │  │   └── 7 vital parameters × [Observed, Population, Base, Adjusted]   │ │
│  │  └── Component Factors Table (Table 2b)                                 │ │
│  │      └── Factor Grid (2×3 per vital parameter)                          │ │
│  │          └── Factor Cells with estimate lines and CIs                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ TAB 2: RBC Transfusion Effects (#rbc-transfusions-tab)                  │ │
│  │  ├── Controls Card                                                      │ │
│  │  │   ├── Time Range Controls (min/max/reset)                           │ │
│  │  │   ├── Display Options (3 checkboxes)                                │ │
│  │  │   │   ├── Show Confidence Interval                                  │ │
│  │  │   │   ├── Show Base Model                                           │ │
│  │  │   │   └── Show Change from Baseline                                 │ │
│  │  │   └── Vital Parameter Toggle Buttons (7)                            │ │
│  │  │       └── MAP | SBP | DBP | HR | FiO2 | SpO2 | VE                   │ │
│  │  ├── Model Information Card                                             │ │
│  │  └── Plots Container                                                    │ │
│  │      └── Plot Pairs (one per selected vital)                           │ │
│  │          ├── Transfusion Effect Chart (left)                           │ │
│  │          └── LOESS Analysis Chart (right)                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ TAB 3: Component Factor Effects (#rbc-component-factors-tab)            │ │
│  │  ├── Controls Panel                                                     │ │
│  │  │   ├── Available Parameters Collapsible                              │ │
│  │  │   ├── Vital Parameter Dropdown                                      │ │
│  │  │   ├── RBC Component Factor Dropdown                                 │ │
│  │  │   ├── Time Range Slider (0-720 min)                                 │ │
│  │  │   ├── Display Options Checkboxes                                    │ │
│  │  │   └── Comparison Tags (dynamic based on factor)                     │ │
│  │  ├── Model Descriptions Card                                            │ │
│  │  ├── Main Chart (1056px, Chart.js line chart)                          │ │
│  │  └── SVG Export Button                                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ TAB 4: Descriptive Statistics (#descriptive-stats-tab)                  │ │
│  │  ├── Patient Statistics Section                                         │ │
│  │  │   ├── Sex Distribution Chart                                        │ │
│  │  │   ├── Age Statistics Table                                          │ │
│  │  │   ├── Age Groups Chart                                              │ │
│  │  │   └── RBC Units per Patient Chart                                   │ │
│  │  ├── Donor Statistics Section                                           │ │
│  │  │   ├── Donor Hemoglobin Distribution                                 │ │
│  │  │   ├── Donor Sex Distribution                                        │ │
│  │  │   ├── Donor Parity Distribution                                     │ │
│  │  │   └── Donation Weekday Distribution                                 │ │
│  │  └── Storage Statistics Section                                         │ │
│  │      └── RBC Storage Time Distribution                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Loading Indicator (Modal Overlay)                                       │ │
│  │  └── Animated Spinner + Message                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Error Notifications (Animated Toasts)                                   │ │
│  │  └── Icon + Message + Close Button (auto-dismiss 10s)                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Architecture

### 6.1 Data File Categories

```
/data/
│
├── INDEX FILES
│   ├── viz_index.csv                    # Master mapping: VitalParam -> CompFactor
│   └── transfusion_viz_index.csv        # Transfusion-specific index
│
├── VISUALIZATION DATA (35 files)
│   │   Pattern: VIZ_{VITAL}_{FACTOR}.csv
│   │   Example: VIZ_ARTm_DONORSEX.csv
│   │
│   ├── VIZ_ARTd_*.csv (5 files)         # Diastolic BP
│   ├── VIZ_ARTm_*.csv (5 files)         # Mean Arterial Pressure
│   ├── VIZ_ARTs_*.csv (5 files)         # Systolic BP
│   ├── VIZ_FIO2_*.csv (5 files)         # Fraction Inspired O2
│   ├── VIZ_HR_*.csv (5 files)           # Heart Rate
│   ├── VIZ_SPO2_*.csv (5 files)         # Peripheral O2 Saturation
│   └── VIZ_VE_*.csv (5 files)           # Minute Ventilation
│
├── TRANSFUSION EFFECT DATA (7 files)
│   └── VIZ_{VITAL}_TRANSFUSION.csv
│
├── LOESS ANALYSIS (2 files)
│   ├── VIZ_LOESS.csv
│   └── VIZ_LOESS_final_with_range.csv
│
├── SUMMARY DATA (4 files)
│   ├── observed_data_summary.csv        # Table 2a observed data
│   ├── model_based_summary.csv          # Table 2a model estimates
│   ├── factor_observed_data_summary.csv # Table 2b observed data
│   └── factor_model_based_summary.csv   # Table 2b model estimates
│
└── DESCRIPTIVE STATISTICS (11 files)
    ├── unique_patients_count.csv        # 6,736 patients
    ├── total_transfused_units.csv       # 14,655 units
    ├── patient_sex_distribution.csv
    ├── patient_age_stats.csv
    ├── patient_age_groups.csv
    ├── rbc_units_per_patient.csv
    ├── donorhb_distribution.csv
    ├── storage_distribution.csv
    ├── donor_sex_distribution.csv
    ├── donor_parity_distribution.csv
    └── donation_weekday_distribution.csv
```

### 6.2 CSV Schema: Visualization Files

```
VIZ_{VITAL}_{FACTOR}.csv Schema:
─────────────────────────────────
TimeFromTransfusion    NUMERIC    Minutes from transfusion (-720 to +720)
PredVal_Base           NUMERIC    Base model predicted value
StdErrVal_Base         NUMERIC    Base model standard error
PredVal_Full           NUMERIC    Fully adjusted model predicted value
StdErrVal_Full         NUMERIC    Fully adjusted model standard error
Lower_Full             NUMERIC    95% CI lower bound (full model)
Upper_Full             NUMERIC    95% CI upper bound (full model)
Delta_Base             NUMERIC    Change from baseline (base model)
Delta_Full             NUMERIC    Change from baseline (full model)
Delta_Lower            NUMERIC    95% CI lower (delta)
Delta_Upper            NUMERIC    95% CI upper (delta)
{ComparisonColumn}     NUMERIC    Category code (DonorHb_Cat, Storage_Cat, etc.)
VitalParam             STRING     Vital parameter code
CompFactor             STRING     Component factor code
CompName               STRING     Human-readable factor name
VitalName              STRING     Human-readable vital name
YLabel                 STRING     Y-axis label for absolute values
DeltaYLabel            STRING     Y-axis label for delta values
```

### 6.3 Scientific Parameters

**Vital Parameters (7):**

| Code | Full Name | Unit | Display |
|------|-----------|------|---------|
| ARTm | Mean Arterial Pressure | mmHg | MAP |
| ARTs | Systolic Blood Pressure | mmHg | SBP |
| ARTd | Diastolic Blood Pressure | mmHg | DBP |
| HR | Heart Rate | bpm | HR |
| FIO2 | Fraction of Inspired Oxygen | % | FiO2 |
| SpO2 | Peripheral Capillary O2 Saturation | % | SpO2 |
| VE | Minute Ventilation | L/min | VE |

**RBC Component Factors (5):**

| Code | Full Name | Categories |
|------|-----------|------------|
| DonorHb_Cat | Donor Hemoglobin | <125, 125-139, 140-154, 155-169, ≥170 g/L |
| Storage_Cat | RBC Storage Time | <10, 10-19, 20-29, 30-39, ≥40 days |
| DonorSex | Donor Sex | Male, Female |
| DonorParity | Donor Parity | Nulliparous, Parous |
| wdy_donation | Weekday of Donation | Sunday-Saturday (1-7) |

### 6.4 Statistical Models

**Base Model:**
```
Linear Mixed-Effects Model:
- Random intercept: Patient ID
- Fixed effects:
  - Time from transfusion (cubic spline)
  - Patient age
  - ICU admission time (spline)
  - RBC transfusion count
  - Patient sex
  - ICU ward
```

**Fully Adjusted Model:**
```
All Base Model variables PLUS:
- Cumulative crystalloid fluid (1h & 24h prior, splines)
- Cumulative vasopressor volume (1h & 24h prior, splines)
- Sedative administration (1h & 24h prior, binary)
```

---

## 7. State Management

### 7.1 Dashboard Class State

```javascript
class TransfusionDashboard {
  // Data references
  fileCase: 'uppercase' | 'lowercase',   // Auto-detected file naming
  indexData: Array,                      // viz_index.csv parsed data
  vitalParams: Array<{value, label}>,    // Available vital parameters
  compFactors: Array<{value, label}>,    // Available component factors
  chartData: {data, comparisonColumn},   // Current visualization data

  // User selections
  selectedVital: string,                 // e.g., 'ARTm'
  selectedCompFactor: string,            // e.g., 'DonorSex'
  selectedComparisons: Array<string>,    // Active comparison categories
  timeRange: [number, number],           // [0, 720] minutes

  // Display options
  showConfidenceInterval: boolean,       // Default: true
  showBaseModel: boolean,                // Default: false
  showDeltaPlot: boolean,                // Default: true

  // UI references
  chart: Chart,                          // Main Chart.js instance
  charts: {},                            // Multiple charts (transfusions tab)
  statsData: {},                         // Cached descriptive statistics

  // Metadata
  metaInfo: {vitalName, compName, yLabel, DeltaYLabel},
  comparisonValues: Array,               // Available comparison values
  currentFileName: string,               // Currently loaded file

  // Debug
  debugMode: boolean,                    // URL param: ?debug=true
  debugOutput: HTMLElement               // Debug panel element
}
```

### 7.2 RBC Transfusions Module State

```javascript
// transfusions.js module state
{
  timeRange: [0, 720],                   // Minutes post-transfusion
  showConfidenceInterval: true,
  showBaseModel: false,
  showDeltaPlot: true,
  selectedVitalParams: Array<string>,    // Multi-select enabled
  charts: {},                            // Chart instance per vital param
  vitalParamInfo: Array,                 // Metadata for each parameter
  fileCase: string,                      // Inherited from dashboard
  logDebug: Function                     // Debug logger function
}
```

### 7.3 State Flow Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT PATTERN                      │
└─────────────────────────────────────────────────────────────────┘

User Action (dropdown/button/checkbox)
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Event Handler                                                    │
│   - Update state property                                        │
│   - e.g., this.selectedVital = newValue                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Side Effect Function                                             │
│   - Load new data if needed (loadVisualizationData)             │
│   - Update dependent state (updateCompFactors)                   │
│   - Trigger re-render (updateChart)                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ UI Update                                                        │
│   - Destroy old Chart.js instance                               │
│   - Create new Chart.js instance with updated config            │
│   - Update DOM elements (tags, labels)                          │
└─────────────────────────────────────────────────────────────────┘

Persistence: Only theme stored in localStorage
```

---

## 8. User Interaction Flows

### 8.1 Vital Parameter Selection Flow

```
┌─────────┐     ┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│  User   │────►│   Dropdown  │────►│ updateComp-   │────►│   loadViz-  │
│  Click  │     │   Change    │     │ Factors()     │     │ Data()      │
└─────────┘     └─────────────┘     └───────────────┘     └──────┬──────┘
                                                                  │
                     ┌────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────┐     ┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│ safeFetch() │────►│ Papa.parse()│────►│ create        │────►│ updateChart │
│ CSV file    │     │             │     │ Comparison    │     │ ()          │
└─────────────┘     └─────────────┘     │ Tags()        │     └──────┬──────┘
                                        └───────────────┘            │
                     ┌───────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────┐     ┌─────────────┐
│ prepareChart│────►│ renderChart │
│ Data()      │     │ ()          │
└─────────────┘     └─────────────┘
```

### 8.2 Display Option Toggle Flow

```
User toggles checkbox (e.g., "Show Confidence Interval")
         │
         ▼
Event listener: e.target.checked
         │
         ├─► Update state: this.showConfidenceInterval = checked
         │
         └─► updateChart()
               │
               ├─► prepareChartData()
               │     │
               │     └─► IF showConfidenceInterval:
               │           - Create lower CI dataset (fill: 'origin')
               │           - Create upper CI dataset (fill: '-1')
               │           - Create main line dataset
               │         ELSE:
               │           - Create main line dataset only
               │
               └─► renderChart()
                     └─► new Chart() with updated datasets
```

### 8.3 Comparison Tag Selection Flow

```
User clicks comparison tag (e.g., "Male")
         │
         ▼
tag.addEventListener('click')
         │
         ├─► Toggle value in selectedComparisons array
         │     - IF present: remove
         │     - IF absent: add
         │
         ├─► recreateTags()
         │     └─► createComparisonTags() with updated selection
         │           └─► Re-attach click handlers (recursive pattern)
         │
         └─► updateChart()
               │
               └─► prepareChartData()
                     │
                     └─► Filter data to only include selectedComparisons
```

---

## 9. Theming System

### 9.1 Theme Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      THEME SYSTEM                                │
└─────────────────────────────────────────────────────────────────┘

CSS Variables (styles.css):
─────────────────────────────
:root {
  /* Dark Theme (Default) */
  --bg-main: #0a0a0a;
  --bg-card: #141414;
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.78);
  --accent-highlight: #E82127;
  --accent-primary: #0A84FF;
  --accent-secondary: #635BFF;
  ...
}

body.light-theme {
  /* Light Theme Override */
  --bg-main: #f8f9fa;
  --bg-card: #ffffff;
  --text-primary: #111827;
  --text-secondary: rgba(0, 0, 0, 0.7);
  ...
}

Theme Detection & Application:
─────────────────────────────
1. Check localStorage('theme')
2. Fallback: prefers-color-scheme media query
3. Apply: body.classList.toggle('light-theme')
4. Dispatch: CustomEvent('themeChanged')
5. Charts: Re-render with new colors
```

### 9.2 Theme-Aware Chart Configuration

```javascript
// In visualization.js and transfusions.js
const isLightTheme = document.body.classList.contains('light-theme');

const chartOptions = {
  scales: {
    x: {
      grid: {
        color: isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
      },
      ticks: {
        color: isLightTheme ? '#333' : '#fff'
      }
    },
    y: {
      grid: {
        color: isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
      },
      ticks: {
        color: isLightTheme ? '#333' : '#fff'
      }
    }
  },
  plugins: {
    legend: {
      labels: {
        color: isLightTheme ? '#333' : '#fff'
      }
    }
  }
};
```

### 9.3 Color Palette

```
Design System Colors:
────────────────────
ACCENT COLORS:
  --accent-highlight: #E82127 (SCANDAT/Tesla Red)
  --accent-primary:   #0A84FF (Apple Blue)
  --accent-secondary: #635BFF (Stripe Purple)
  --accent-tertiary:  #E62B1E (Orange-Red)

CHART COLORS (8-color palette):
  1. #635BFF (Purple)
  2. #E82127 (Red)
  3. #10B981 (Green)
  4. #F59E0B (Orange)
  5. #0A84FF (Blue)
  6. #8B5CF6 (Purple accent)
  7. #EC4899 (Pink)
  8. #06B6D4 (Cyan)

FUNCTIONAL COLORS:
  --error:   #FF4B59
  --success: #10B981
  --warning: #F59E0B
  --info:    #0A84FF
```

---

## 10. Dependencies

### 10.1 External Libraries (CDN)

| Library | Version | CDN | Purpose |
|---------|---------|-----|---------|
| Chart.js | 3.9.1 | jsdelivr | Interactive charts |
| PapaParse | 5.3.2 | cloudflare | CSV parsing |
| Lodash | 4.17.21 | cloudflare | Data utilities |
| FileSaver.js | 2.0.5 | cloudflare | SVG export |

### 10.2 Google Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500&family=Inter:wght@400;500;600&family=Roboto:wght@400&display=swap" rel="stylesheet">
```

| Font | Weights | Usage |
|------|---------|-------|
| Montserrat | 300, 400, 500 | Headings |
| Inter | 400, 500, 600 | Body text |
| Roboto | 400 | Monospace elements |

### 10.3 Development Dependencies

- **Python 3.x**: Standard library only
  - `http.server.SimpleHTTPRequestHandler`
  - `socketserver.TCPServer`

---

## 11. Known Issues & Technical Debt

### 11.1 Architectural Issues

| Issue | Location | Description | Impact |
|-------|----------|-------------|--------|
| **Monolithic Controller** | dashboard.js | Mixes orchestration with Component Factor Effects tab implementation | Hard to maintain |
| **Hardcoded HTML** | All modules | Views generated by string concatenation | Brittle, error-prone |
| **Naming Confusion** | componentFactors.js | Controls Table 2b, NOT the Component Factor Effects tab | Confusing |
| **Duplicated Theme Code** | visualization.js, transfusions.js | Theme detection logic duplicated | Inconsistency risk |
| **Global State** | dashboard.js | State implicitly relied upon by other modules | Tight coupling |

### 11.2 State Management Issues

| Issue | Description |
|-------|-------------|
| Multiple Sources of Truth | `dashboard.selectedVital`, dropdown value, and `transfusions.state` can desync |
| No State Normalization | State scattered across class properties and module-level objects |
| Unbounded Async | No cancellation tokens for in-flight CSV fetches |

### 11.3 Error Handling Gaps

| Location | Issue |
|----------|-------|
| descriptiveStats.js | Soft failure - shows error but continues |
| componentFactors.js | No explicit error handling for initialization |
| transfusions.js | LOESS data failures silently continue |

### 11.4 Resource Management

| Issue | Description |
|-------|-------------|
| Chart Instance Leaks | Not all charts properly destroyed before recreation |
| Event Listener Accumulation | Dynamic elements (comparison tags) may accumulate listeners |
| Memory Usage | Large CSV files parsed entirely into memory |

### 11.5 Hardcoded Dependencies

| Dependency | Location |
|------------|----------|
| DOM Element IDs | dashboard.js tightly coupled to HTML IDs |
| Chart.js 3.9.1 | Version-specific configuration |
| File naming convention | `VIZ_{VITAL}_{FACTOR}.csv` pattern |

---

## 12. Operational Guide

### 12.1 Running the Application

```bash
# Navigate to project directory
cd W:\Transfusion-Dashboard

# Start development server
python serve.py

# Access application
# Browser: http://localhost:8000

# Debug mode
# Browser: http://localhost:8000?debug=true
```

### 12.2 Adding New Data

1. **Add CSV file** to `/data/` following `VIZ_{VITAL}_{FACTOR}.csv` convention
2. **Update `viz_index.csv`** to include new Vital/Factor combination
3. **Refresh browser** - dropdowns auto-populate from index

### 12.3 Extending the Application

**Add New Vital Parameter:**
1. Add rows to `viz_index.csv` for all 5 factors
2. Create `VIZ_{NEW_VITAL}_{FACTOR}.csv` files (5 files)
3. Create `VIZ_{NEW_VITAL}_TRANSFUSION.csv`
4. Add to LOESS data file

**Add New Component Factor:**
1. Add rows to `viz_index.csv` for all 7 vitals
2. Create `VIZ_{VITAL}_{NEW_FACTOR}.csv` files (7 files)
3. Update comparison column detection in `visualization.js`

### 12.4 Deployment Checklist

- [ ] All CSV files in `./data/`
- [ ] CSS files in `./css/`
- [ ] JavaScript files in `./js/`
- [ ] `index.html` as entry point
- [ ] External CDN links accessible
- [ ] Static HTTP server configured
- [ ] CORS headers if cross-origin

### 12.5 Browser Compatibility

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

**Required Features:**
- ES6+ JavaScript
- CSS Variables
- Fetch API
- localStorage
- Canvas API

---

## Appendix A: File Loading Flow

```
safeFetch(baseName, fileCase, logDebug)
         │
         ├─► Try: ./data/{NAME}.CSV (uppercase)
         │         │
         │         └─► IF 200: return {text, path}
         │
         ├─► Try: ./data/{name}.csv (lowercase)
         │         │
         │         └─► IF 200: return {text, path}
         │
         └─► IF all fail: throw last error
```

---

## Appendix B: Chart.js Plugin (Vertical Zero Line)

```javascript
// Custom plugin to draw vertical line at transfusion time (t=0)
const verticalLinePlugin = {
  id: 'verticalLine',
  afterDraw: (chart) => {
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    const ctx = chart.ctx;

    const xPos = xScale.getPixelForValue(0);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xPos, yScale.top);
    ctx.lineTo(xPos, yScale.bottom);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#E82127'; // SCANDAT Red
    ctx.stroke();
    ctx.restore();
  }
};
```

---

## Appendix C: Responsive Breakpoints

```css
/* Desktop (default) */
@media (max-width: 1200px) {
  .container { padding: 16px; }
}

/* Tablet */
@media (max-width: 768px) {
  .stats-container { flex-direction: column; }
  .plot-pair { flex-direction: column; }
  font-size: reduced;
}

/* Mobile */
@media (max-width: 480px) {
  .tab-btn { padding: 8px 12px; }
  font-size: further reduced;
  padding: minimal;
}
```

---

*Document generated by architectural analysis agents. Last updated: December 2024.*
