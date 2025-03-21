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
├── css/
│   └── styles.css          # Extracted styles
├── js/
│   ├── utils.js            # Utility functions used across modules
│   ├── descriptiveStats.js # Descriptive statistics functionality
│   ├── visualization.js    # RBC transfusions visualization
│   ├── componentFactors.js # RBC component factors functionality
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

Handles the "RBC Transfusions" tab:
- Creates visualization controls UI
- Loads and processes time-series data
- Prepares data for Chart.js
- Renders interactive charts

Key functions:
- `loadVisualizationData()`
- `prepareChartData()`
- `renderChart()`

#### 4. Component Factors Module (`componentFactors.js`)

Manages the "RBC Component Factors" tab:
- Currently contains placeholder functionality
- Designed for future extension

Key functions:
- `createRbcComponentFactorsContent()`
- `initializeRbcComponentFactors()`

#### 5. Utilities Module (`utils.js`)

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
5. User interacts with tabs and controls
6. Appropriate module processes the selections
7. Visualizations are updated based on user input

## CSV Data Processing

The application handles several types of CSV files:
- Patient demographic data
- Transfusion unit statistics
- Donor characteristics
- Time-series data for vital parameters

Files are loaded using the `safeFetch()` utility which attempts multiple path variations to handle case sensitivity issues. CSV parsing is done with PapaParse library.

## Visualization Pipeline

1. User selects vital parameter and component factor
2. Data is loaded via `loadVisualizationData()`
3. Data is processed via `prepareChartData()`
4. Chart is rendered via `renderChart()`
5. User can filter by comparison values and adjust display options

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

### Enhancing the RBC Component Factors Tab

The componentFactors.js module is designed as a placeholder for future extension:
1. Implement the placeholder functions
2. Add specific visualizations for component factor analysis
3. Connect to the dashboard via the existing initialization hooks

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

This architecture is designed to be modular, maintainable, and extensible, supporting future development while maintaining a clear separation of concerns.