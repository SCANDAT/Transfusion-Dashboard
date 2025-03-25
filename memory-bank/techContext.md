# Technical Context: Transfusion Dashboard

## Technology Stack

The Transfusion Dashboard is built using a client-side web technology stack:

### Core Technologies

- **HTML5**: Structural foundation of the application
- **CSS3**: Styling and responsive design implementation
- **JavaScript (ES6+)**: Core programming language for application logic

### Libraries & Dependencies

- **Chart.js**: Primary visualization library for creating interactive charts
- **PapaParse**: CSV parsing library for data processing
- **Lodash**: Utility library for data manipulation

### No Build Pipeline

The application uses vanilla JavaScript without a build process, meaning:
- No transpilation step is required
- No module bundling
- Direct browser execution of ES6+ code
- Native module imports

## Development Environment

### Local Development Server

The project includes a Python-based development server (`serve.py`) that:
- Serves files from the project directory
- Adds proper CORS headers to avoid cross-origin restrictions
- Runs on http://localhost:8000 by default
- Simplifies local testing of CSV data loading

Usage:
```
python serve.py
```

### Browser Requirements

The application targets modern browsers with:
- ES6+ support
- Modern CSS capabilities
- SVG support for visualizations

## Design System Implementation

The design system is implemented using native CSS variables:

```css
:root {
  /* Base Colors - Dark Theme (Default) */
  --bg-main: #0a0a0a;
  --bg-card: #141414;
  --text-primary: #ffffff;
  
  /* Accent colors */
  --accent-primary: #0A84FF;
  --accent-secondary: #635BFF;
  --accent-highlight: #E82127;
  
  /* Functional colors */
  --color-error: #FF4B59;
  --color-success: #10B981;
  --color-warning: #F59E0B;
}
```

### Theme System Implementation

#### Theme Variables

Theme switching is implemented via class toggling and CSS variables:

```css
/* Default dark theme in :root */
:root {
  /* Base Colors - Dark Theme (Default) */
  --bg-main: #0a0a0a;
  --bg-card: #141414;
  --bg-card-hover: #1c1c1c;
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.78);
  
  /* Chart colors for dark theme */
  --chart-color-1: #635BFF; /* Stripe Purple */
  --chart-color-2: #E82127; /* Tesla Red */
  /* and more... */
}

/* Light theme overrides */
.light-theme {
  --bg-main: #f8f9fa;
  --bg-card: #ffffff;
  --text-primary: #111827;
  
  /* Chart colors for light theme */
  --chart-color-1: var(--chart-color-1-light);
  --chart-color-2: var(--chart-color-2-light);
  /* and more... */
}
```

#### JavaScript Theme Detection

Theme detection is performed consistently across modules using:

```javascript
// Check if light theme is active
const isLightTheme = document.body.classList.contains('light-theme');

// Use in conditional rendering
const textColor = isLightTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)';
```

#### Theme Toggle Event Listener

Components listen for theme changes:

```javascript
document.addEventListener('themeChanged', () => {
  // Update charts or UI elements when theme changes
  updateAllCharts();
});
```

#### Component-Specific Theming

Different component types require specific theming approaches:

1. **Static UI Elements**: Use CSS variables directly
2. **Chart.js Elements**: Configure via JavaScript conditionals
3. **Dynamic Content**: Apply appropriate classes or styles at creation time
4. **Tooltips & Overlays**: Use consistent styling regardless of theme

#### Theme-Related Duplication

The theme-aware code is currently duplicated across different JavaScript modules:

1. **visualization.js**: Contains Chart.js config for Component Factors tab
2. **transfusions.js**: Contains similar Chart.js config for RBC Transfusion Effects tab
3. Both need to be updated when fixing theme-related issues

### Typography

The typographic system uses a combination of:
- **Headings**: Montserrat (300, 400, 500 weights)
- **Body**: Inter (400, 500, 600 weights)
- **Monospace**: Roboto Mono

These are loaded via external stylesheets or web font services.

### Responsive Design

The responsive system is based on:
- A base 16px font size
- Relative units (rem, em) for sizing
- Media queries at key breakpoints:
  - Desktop: 1200px+
  - Tablet: 768px-1199px
  - Mobile: <767px

## File Structure

```
transfusion-dashboard/
├── index.html              # Main HTML entry point
├── serve.py                # Local development server with CORS support
├── css/
│   └── styles.css          # Extracted styles for all components
├── js/
│   ├── utils.js            # Utility functions used across modules
│   ├── descriptiveStats.js # Descriptive statistics functionality
│   ├── visualization.js    # Core visualization functionality
│   ├── componentFactors.js # RBC component factors visualization
│   ├── transfusions.js     # RBC transfusions visualization
│   └── dashboard.js        # Main controller class
└── data/
    └── *.csv               # Data files
```

## Data Structure

### CSV File Organization

The data directory contains multiple CSV file types:

1. **Descriptive Statistics Files**:
   - Patient demographics (age, sex distribution)
   - Blood component characteristics
   - Transfusion unit counts

2. **Visualization Data Files**:
   - Donor factor data (sex, hemoglobin, parity)
   - Storage condition data
   - Vital parameter time-series data
   - LOESS analysis data

3. **Index Files**:
   - Metadata for visualization options
   - Parameter mappings and relationships

### File Naming Conventions

Files follow specific naming patterns:
- `VIZ_[PARAMETER]_[FACTOR].csv` for visualization data
- Descriptive names for statistic files (e.g., `patient_sex_distribution.csv`)

## Technical Constraints

### Browser-Side Processing

All data processing happens client-side:
- CSV files must be loaded via AJAX requests
- Data transformation occurs in the browser
- No server-side computation is available

### CSV Data Format

Data is exclusively provided in CSV format:
- Consistent header structure is expected
- Numerical data for chart rendering
- Categorical data for grouping and filtering

### External Dependencies

The application has minimal external dependencies:
- Chart.js (loaded via CDN)
- Web fonts (loaded via external stylesheet)
- No backend API dependencies

## Development Patterns

### Debugging

Debug functionality is provided through:
- URL parameter enabling (`?debug=true`)
- Console logging via `logDebug()` utility
- Error display in the UI for critical issues

### Error Handling

The application implements robust error handling:
- Case-insensitive file path handling
- Fallback options for data loading
- User-friendly error messages
- Graceful degradation when data is unavailable

### SVG Export

A key technical feature is SVG export capability:
- Chart.js configurations optimized for export
- Vector-based output for publication quality
- Text remains editable in the exported files
