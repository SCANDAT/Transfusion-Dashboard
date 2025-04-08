# Component Factors Module Documentation

## Overview

The Component Factors module is a core part of the Transfusion Dashboard, responsible for visualizing how different RBC component factors (donor and storage characteristics) affect vital parameters in ICU patients. This module has the unique characteristic of serving dual purposes:

1. **Powering the dedicated "Component Factor Effects" tab** with interactive visualizations
2. **Generating Table 2b in the Main Findings tab** which provides a concise summary of component factor effects

## Key Files

The module consists of two primary files:

- **js/componentFactors.js**: Core JavaScript implementation
- **css/componentFactors.css**: Specialized styling for the component factor visualizations

## System Integration

### Initialization Flow

1. **Loading**: `index.html` loads both files along with other core modules
2. **Dashboard Initialization**: The `TransfusionDashboard` class in `dashboard.js` creates the application structure
3. **Tab Structure**: During initialization, the dashboard creates both:
   - A dedicated "Component Factor Effects" tab
   - The "Main Findings" tab where Table 2b appears
4. **Component Initialization**: Dashboard calls `initializeRbcComponentFactors()` which:
   - Sets up the RBC Component Factors tab
   - Checks if the Main Findings tab exists and has Table 2a but not Table 2b
   - If so, adds Table 2b to the Main Findings tab

### Data Flow

```mermaid
flowchart TD
    CSV1[factor_observed_data_summary.csv] --> LoadFunctions
    CSV2[factor_model_based_summary.csv] --> LoadFunctions
    
    LoadFunctions[Load Functions:\nloadFactorObservedDataSummary()\nloadFactorModelBasedSummary()] --> Process
    
    Process[processComponentFactorData()] --> VitalSections
    
    VitalSections[createVitalParameterSection()\nFor each vital parameter] --> FactorViz
    
    FactorViz[renderFactorVisualization()\nFor each component factor] --> EstimateViz
    
    EstimateViz[renderEstimate()\nFor observed, base, and adjusted models] --> Final
    
    Final[Final HTML for Table 2b]
```

## Table 2b Generation

Table 2b ("RBC Component Factor Effects on Vital Parameters") is generated through a series of function calls:

1. **Data Loading**:
   - `loadFactorObservedDataSummary()` fetches observed effects data
   - `loadFactorModelBasedSummary()` fetches model-based effects data
   - Both functions use `safeFetch()` for resilient file loading with case-insensitive paths

2. **Data Processing**:
   - `processComponentFactorData()` transforms raw CSV data into a structured object:
     - Organizes by vital parameter → component factor → category
     - Handles observed data, base model, and fully adjusted model estimates
     - Preserves confidence intervals and statistical significance (p-values)

3. **HTML Generation**:
   - `createComponentFactorsTable()` builds the complete Table 2b structure
   - Creates a header with legend explaining the three estimate types and significance indicators
   - For each vital parameter, calls `createVitalParameterSection()`

4. **Vital Parameter Sections**:
   - `createVitalParameterSection()` creates a section for each vital parameter
   - Organizes component factors in a 2×3 grid layout
   - For each factor, calls `renderFactorVisualization()`

5. **Factor Visualization**:
   - `renderFactorVisualization()` creates the small multiples display for each factor
   - Handles axis generation with consistent scaling across all factors
   - For each category (e.g., donor Hb ranges, storage times), calls `renderEstimate()`

6. **Estimate Rendering**:
   - `renderEstimate()` creates:
     - Horizontal lines representing confidence intervals
     - Points showing the mean effect estimate
     - Labels showing the numerical values and statistical significance

7. **Integration with Main Findings**:
   - The `initializeMainFindings()` function in `mainFindings.js` loads both Table 2a and Table 2b data
   - `createMainFindingsContent()` combines both tables into a single view
   - Table 2b appears below Table 2a in the Main Findings tab

## Visual Implementation Details

The component factor visualization uses a sophisticated small multiples technique:

1. **Grid Layout**:
   - 2×3 grid showing different component factors (donor Hb, storage time, etc.)
   - Each grid cell contains a separate factor visualization
   - The grid is responsive, collapsing to 2 columns or 1 column on smaller screens

2. **Consistent Scaling**:
   - All visualizations within a vital parameter section share the same x-axis scale
   - The scale is automatically calculated to show the full range of data with margins
   - Zero point is emphasized with a vertical reference line

3. **Color Coding**:
   - Observed population estimates: Blue (chart-color-1)
   - Base model estimates: Orange/Red (chart-color-2)
   - Fully adjusted model estimates: Green (chart-color-3)

4. **Statistical Significance**:
   - P-values are displayed with significance indicators (* p<0.05, ** p<0.01, *** p<0.001)
   - Confidence intervals are shown as horizontal lines

## Specialized Functions

### Parameter Mapping

The module includes specialized mapping functions that provide human-readable names:

1. **`getParameterDetails(param)`**:
   - Maps vital parameter abbreviations to full names, units, and shorter abbreviations
   - Example: 'ARTm' → { name: 'Mean Arterial Pressure', unit: 'mmHg', abbr: 'MAP' }
   - This function is duplicated in `mainFindings.js` (a source of potential bugs if implementations diverge)

2. **`getCategoryLabel(factor, category)`**:
   - Converts numeric category codes to human-readable labels
   - Example: For 'DonorHb_Cat', '1' → '<125 g/L'

3. **`getFactorName(factor)`**:
   - Maps factor codes to full names
   - Example: 'DonorHb_Cat' → 'Donor Hemoglobin'

### Scale and Position Calculations

The module includes precise positioning functions for consistent visualization:

1. **`calculateScaleRange(paramData)`**:
   - Determines the min/max values for the axis scale
   - Ensures zero is included in the range when appropriate
   - Adds margin for visual clarity

2. **`valueToPosition(value, min, max, width)`**:
   - Converts data values to pixel positions for rendering
   - Ensures precise alignment of values

## CSS Implementation

The `componentFactors.css` file provides specialized styling:

1. **Nested Structure**:
   - `.component-factors-visualization` → `.vital-parameter-section` → `.factor-grid` → `.factor-cell`
   - Each level has specific styling for proper visual hierarchy

2. **Visualization Elements**:
   - `.factor-plot`: Contains the actual visualization with proper spacing
   - `.zero-line`: Vertical reference line at zero
   - `.estimate-line`, `.estimate-point`: Visual elements for estimates and confidence intervals

3. **Responsive Design**:
   - Media queries adjust the grid layout for different screen sizes
   - At 1200px breakpoint: Changes to 2-column grid
   - At 768px breakpoint: Changes to 1-column grid

4. **Theme Support**:
   - Uses CSS variables (e.g., `var(--text-primary)`, `var(--chart-color-1)`)
   - Ensures consistent appearance in both light and dark modes

## Code Reuse Considerations

The component factors module highlights some important code reuse patterns in the application:

1. **Function Duplication**:
   - `getParameterDetails()` is implemented in both `componentFactors.js` and `mainFindings.js`
   - These implementations must remain synchronized to avoid bugs (as seen in the "undefined" parameter issue)

2. **Shared Visualization Logic**:
   - Scale calculation, positioning, and rendering follow similar patterns to other visualization modules
   - Future refactoring could extract common visualization utilities to reduce duplication

3. **Dual-Purpose Components**:
   - The same visualization code serves both the dedicated tab and Table 2b in Main Findings
   - This approach ensures consistency but requires careful coordination when making changes
