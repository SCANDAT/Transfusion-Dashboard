# Transfusion Dashboard - Architecture Overview

## Project Overview

The Transfusion Dashboard is a web-based visualization tool for analyzing and displaying blood transfusion data. The dashboard visualizes time-series data after blood transfusion, showing how different donor and blood component factors affect vital parameter trajectories in ICU patients.

The application processes CSV data files containing:
1. Descriptive statistics of transfused patients and blood components
2. RBC transfusion impact on vital parameters
3. RBC component factors and their effects

## Architecture Design

The application follows a modular architecture with clear separation of concerns:

```
transfusion-dashboard/
├── index.html              # Main HTML entry point
├── serve.py                # Local development server with CORS support
├── css/
│   └── styles.css          # Extracted styles for all components
├── js/
│   ├── utils.js            # Utility functions used across modules
│   ├── descriptiveStats.js # Descriptive statistics functionality
│   ├── visualization.js    # Core visualization functionality (used by component factors)
│   ├── componentFactors.js # RBC component factors visualization (donor, storage factors)
│   ├── transfusions.js     # RBC transfusions visualization (transfusion effects)
│   └── dashboard.js        # Main controller class
└── data/
    └── *.csv               # Data files
```

### Key Components

#### 1. Dashboard Controller (`dashboard.js`)

The central controller that orchestrates the application. It:
- Initializes the UI
- Manages application state
- Coordinates data loading
- Handles tab switching
- Delegates visualization to appropriate modules

The `TransfusionDashboard` class is the main entry point, initialized from `index.html`.

#### 2. Descriptive Statistics Module (`descriptiveStats.js`)

Responsible for:
- Loading and parsing patient and blood component statistics from CSV files
- Generating dynamic HTML tables for the statistics
- Formatting numbers and percentages consistently

Key functions:
- `loadPatientSexDistribution()`, `loadPatientAgeStats()`, etc.
- `createDescriptiveStatsContent()`

#### 3. Visualization Module (`visualization.js`)

Handles the core visualization functionality:
- Creates visualization controls UI
- Loads and processes time-series data
- Prepares data for Chart.js
- Renders interactive charts

Key functions:
- `loadVisualizationData()`
- `prepareChartData()`
- `renderChart()`
- `createComparisonTags()`

#### 4. Component Factors Module (`componentFactors.js`)

Manages the "RBC Component Factors" tab:
- Provides UI for selecting vital parameters and component factors
- Uses the visualization module for chart rendering
- Shows effects of donor and storage factors on vital parameters

Key functions:
- `createRbcComponentFactorsContent()`
- `initializeRbcComponentFactors()`

#### 5. Transfusions Module (`transfusions.js`)

Handles the "RBC Transfusions" tab:
- Creates a multi-parameter selection interface
- Supports simultaneous display of multiple vital parameters
- Shows transfusion effects with paired standard and LOESS plots
- Provides time range and display option controls

Key functions:
- `createRbcTransfusionsContent()`
- `initializeRbcTransfusions()`
- `loadVitalParameterData()`
- `createOrUpdatePlotPair()`
- `prepareTransfusionChartData()`
- `renderTransfusionChart()`

#### 6. Utilities Module (`utils.js`)

Common utilities shared across modules:
- Tab navigation
- Number formatting
- CSV file fetching
- Error display
- Debug logging

Key functions:
- `safeFetch()` - Robust CSV file loading
- `formatNumber()` and `formatPercent()` - Consistent formatting
- `logDebug()` - Debug functionality

## Data Flow

1. User loads the application
2. Dashboard initializes and creates the UI structure
3. Descriptive statistics are loaded from CSV files
4. Index data is loaded for visualization options 
5. Component factors and transfusions tabs are initialized
6. User interacts with tabs and controls
7. Appropriate module processes the selections
8. Visualizations are updated based on user input

## CSV Data Processing

The application handles several types of CSV files:
- Patient demographic data
- Transfusion unit statistics
- Donor characteristics
- Time-series data for vital parameters
- LOESS analysis data

Files are loaded using the `safeFetch()` utility which attempts multiple path variations to handle case sensitivity issues. CSV parsing is done with PapaParse library.

## Visualization Pipelines

### Component Factors Visualization

1. User selects vital parameter and component factor
2. Data is loaded via `loadVisualizationData()`
3. Data is processed via `prepareChartData()`
4. Chart is rendered via `renderChart()`
5. User can filter by comparison values and adjust display options

### Transfusions Visualization

1. User selects one or more vital parameters via button interface
2. For each selected parameter:
   - Transfusion data is loaded via `loadTransfusionData()`
   - LOESS data is loaded via `loadLoessData()`
   - Data is processed via `prepareTransfusionChartData()` and `prepareLoessChartData()`
   - Charts are rendered via `renderTransfusionChart()` and `renderLoessChart()`
3. User can adjust time range and display options
4. All selected parameter charts update simultaneously

## Extension Points

### Adding New Visualizations

To add new visualization types:
1. Extend the appropriate module (visualization.js or componentFactors.js)
2. Create new rendering functions
3. Update the dashboard.js to connect the new functionality

### Supporting New Data Types

To support new CSV formats:
1. Add new loading functions to descriptiveStats.js or create a new module
2. Extend the dashboard initialization to load and process the new data
3. Create appropriate UI controls and visualization components

### Adding New Visualization Features

The modular architecture makes it easy to extend existing visualizations or add new ones:
1. To add new visualization modes, extend the appropriate module (transfusions.js or componentFactors.js)
2. To add support for new chart types, create new rendering functions in the respective module
3. To add new data transformations, implement new prepare functions following the established patterns

## Technical Dependencies

- Chart.js - For rendering interactive charts
- PapaParse - For CSV parsing
- Lodash - For data manipulation utilities
- Browser ES6+ support

## Development Notes

- Debug mode can be enabled via URL parameter: `?debug=true`
- The application attempts to handle both uppercase and lowercase file paths
- Error handling includes user-friendly messages and detailed console logs
- Responsive design adapts to different screen sizes
- A local development server (serve.py) is provided to avoid CORS issues when testing locally

## Development Utilities

### Local Development Server (serve.py)

The project includes a Python-based local development server to facilitate testing:
- Serves files from the project directory with proper CORS headers
- Helps avoid cross-origin restrictions when loading CSV files locally
- Simple to use: run `python serve.py` and open `http://localhost:8000` in a browser

This server is particularly useful for testing CSV data loading and visualization features that would otherwise be blocked by browser security restrictions when opening HTML files directly.

This architecture is designed to be modular, maintainable, and extensible, supporting future development while maintaining a clear separation of concerns.
