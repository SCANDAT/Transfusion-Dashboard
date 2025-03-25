/**
 * Visualization tab functionality for the Transfusion Dashboard
 * Enhanced with Tesla × Apple × Stripe × TED Design System
 */

/**
 * Create the HTML content for the visualization tab controls
 * @returns {string} HTML content for the controls
 */
function createVisualizationControls() {
    return `
      <div class="controls-panel">
        <div class="available-options">
          <div class="available-options-toggle">Available Parameters & Factors <span class="toggle-icon">▼</span></div>
          <div class="available-options-content">
            <div class="row">
              <div class="col">
                <p><strong>Vital Parameters:</strong></p>
                <ul class="compact-list">
                  <li>Mean Arterial Pressure (mmHg)</li>
                  <li>Systolic Blood Pressure (mmHg)</li>
                  <li>Diastolic Blood Pressure (mmHg)</li>
                  <li>Heart Rate (bpm)</li>
                  <li>Fraction of Inspired Oxygen (%)</li>
                  <li>Peripheral Capillary Oxygen Saturation (%)</li>
                  <li>Minute Ventilation (L/min)</li>
                </ul>
              </div>
              <div class="col">
                <p><strong>RBC Component Factors:</strong></p>
                <ul class="compact-list">
                  <li>Donor Hemoglobin (g/L)</li>
                  <li>Donor Parity (parous or nulliparous)</li>
                  <li>Donor Sex (male or female)</li>
                  <li>RBC Component Storage Time (days)</li>
                  <li>Weekday of Donation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="controls-main">
          <div class="controls-row">
            <div class="controls-col">
              <div class="form-group compact">
                <label class="form-label">Vital Parameter:</label>
                <select id="vital-select" class="form-select"></select>
              </div>
            </div>
            <div class="controls-col">
              <div class="form-group compact">
                <label class="form-label">RBC Component Factor:</label>
                <select id="factor-select" class="form-select"></select>
              </div>
            </div>
          </div>
          
          <div class="controls-row">
            <div class="controls-col">
              <div class="form-group compact">
                <label class="form-label">Time Range (minutes):</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <input type="number" id="time-min" class="form-input" style="width: 80px;" value="0">
                  <span>to</span>
                  <input type="number" id="time-max" class="form-input" style="width: 80px;" value="720">
                  <button id="time-reset" class="btn btn-sm btn-outline">Reset</button>
                </div>
              </div>
            </div>
            <div class="controls-col">
              <div class="form-group compact">
                <label class="form-label">Display Options:</label>
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="show-ci" checked> 
                    <span>Show Confidence Interval</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" id="show-base"> 
                    <span>Show Base Model</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" id="show-delta" checked> 
                    <span>Show Change from Baseline</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="form-group compact">
        <label class="form-label">Comparison Values:</label>
        <div id="comparison-tags" class="comparison-tags-container"></div>
      </div>
      
      <div id="debug-container" style="display: none; margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--border-subtle);">
        <div class="form-group compact">
          <label style="display: flex; align-items: center; gap: var(--space-xs); cursor: pointer;">
            <input type="checkbox" id="debug-mode"> 
            <span>Enable Debug Mode</span>
          </label>
        </div>
        <div id="debug-output" class="debug-info" style="display: none;"></div>
      </div>
    `;
  }
  
/**
   * Create the HTML content for the chart area
   * @returns {string} HTML content for the chart area
   */
function createChartArea() {
  return `
    <div id="chart-title" class="header" style="margin-bottom: 8px;"></div>
    <div id="model-descriptions" class="info compact-model-descriptions" style="margin-bottom: 8px;"></div>
    <div id="chart-container" class="chart-container chart-container-large">
      <div class="chart-actions">
        <button id="export-svg-btn" class="chart-action-btn" title="Export as SVG">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
      </div>
      <canvas id="chart-canvas"></canvas>
    </div>
  `;
}
  
  /**
   * Create the HTML content for the info card
   * @returns {string} HTML content for the info card
   */
  function createInfoCard() {
    return `
      <p>This dashboard visualizes the time series of vital parameters after blood transfusion, showing how different donor and blood component factors affect vital parameter trajectories in ICU patients.</p>
      <div class="row">
        <div class="col">
          <p><strong>Vital Parameters:</strong></p>
          <ul>
            <li>Mean Arterial Pressure (mmHg)</li>
            <li>Systolic Blood Pressure (mmHg)</li>
            <li>Diastolic Blood Pressure (mmHg)</li>
            <li>Heart Rate (bpm)</li>
            <li>Fraction of Inspired Oxygen (%)</li>
            <li>Peripheral Capillary Oxygen Saturation (%)</li>
            <li>Minute Ventilation (L/min)</li>
          </ul>
        </div>
        <div class="col">
          <p><strong>RBC Component Factors:</strong></p>
          <ul>
            <li>Donor Hemoglobin (g/L)</li>
            <li>Donor Parity (parous or nulliparous)</li>
            <li>Donor Sex (male or female)</li>
            <li>RBC Component Storage Time (days)</li>
            <li>Weekday of Donation</li>
          </ul>
        </div>
      </div>
    `;
  }
  
  /**
   * Load visualization data for the selected vital parameter and component factor
   * @param {string} selectedVital - Selected vital parameter
   * @param {string} selectedCompFactor - Selected component factor
   * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
   * @param {Function} logDebug - Debug logging function
   * @returns {Promise<Object>} Object containing the loaded visualization data
   */
  async function loadVisualizationData(selectedVital, selectedCompFactor, fileCase, logDebug) {
    if (!selectedVital || !selectedCompFactor) {
      throw new Error("Selected vital parameter or component factor is not specified");
    }
    
    try {
      const baseFileName = `VIZ_${selectedVital.trim().toUpperCase()}_${selectedCompFactor.trim().toUpperCase()}`;
      logDebug(`Base visualization filename: ${baseFileName}`);
      
      const { text: csvText, path: loadedPath } = await safeFetch(baseFileName, fileCase, logDebug);
      const currentFileName = loadedPath.split('/').pop();
      logDebug(`Using file: ${currentFileName}`);
      
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors && results.errors.length > 0) {
              logDebug(`CSV parse errors: ${JSON.stringify(results.errors)}`);
            }
            
            if (results.data.length === 0) {
              reject(new Error("No data found in the CSV file"));
              return;
            }
            
            logDebug(`Parsed ${results.data.length} rows of visualization data`);
            
            // Extract metadata from the first row
            const firstRow = results.data[0];
            const metaInfo = {
              vitalName: firstRow.VitalName || "Vital Parameter",
              compName: firstRow.CompName || "Comparison Factor",
              yLabel: firstRow.YLabel || "Value",
              DeltaYLabel: firstRow.DeltaYLabel || "Change in Value"
            };
            
            logDebug(`Metadata: ${JSON.stringify(metaInfo)}`);
            
            // Identify the comparison column
            const sampleRow = results.data[0];
            const comparisonColumnName = Object.keys(sampleRow).find(key => 
              key !== 'TimeFromTransfusion' && 
              key !== 'PredVal_Base' && 
              key !== 'StdErrVal_Base' && 
              key !== 'PredVal_Full' && 
              key !== 'StdErrVal_Full' && 
              key !== 'Lower_Full' && 
              key !== 'Upper_Full' && 
              key !== 'VitalParam' && 
              key !== 'CompFactor' && 
              key !== 'CompName' && 
              key !== 'VitalName' && 
              key !== 'YLabel' &&
              key !== 'DeltaYLabel' &&
              key !== 'Delta_Base' &&
              key !== 'Delta_Full' &&
              key !== 'Delta_Lower' &&
              key !== 'Delta_Upper'
            );
            
            if (!comparisonColumnName) {
              logDebug(`Could not determine comparison column. Available columns: ${Object.keys(sampleRow).join(', ')}`);
              reject(new Error("Could not determine comparison column"));
              return;
            }
            
            logDebug(`Determined comparison column: ${comparisonColumnName}`);
            
            // Get all unique comparison values
            let comparisonValues = _.uniqBy(results.data, comparisonColumnName)
              .map(row => row[comparisonColumnName])
              .filter(value => value !== undefined)
              .sort((a, b) => {
                if (a === null) return -1;
                if (b === null) return 1;
                return a - b;
              });
            
            const hasNull = results.data.some(row => row[comparisonColumnName] === null);
            if (hasNull && comparisonValues[0] !== null) {
              comparisonValues.unshift(null);
            }
            
            resolve({
              data: results.data,
              comparisonColumn: comparisonColumnName,
              metaInfo: metaInfo,
              comparisonValues: comparisonValues,
              currentFileName: currentFileName
            });
          },
          error: (error) => {
            logDebug(`CSV parse error: ${error.message}`);
            reject(new Error(`CSV parse error: ${error.message}`));
          }
        });
      });
    } catch (error) {
      logDebug(`Failed to load visualization data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get a human-readable label for a comparison value
   * @param {any} value - The comparison value
   * @param {string} selectedCompFactor - The selected component factor
   * @param {string|null} modelType - Optional model type
   * @returns {string} Human-readable label
   */
  function getLegendLabel(value, selectedCompFactor, modelType = null) {
    if (value === null) return 'Reference';
    
    const factor = selectedCompFactor.trim();
    let categoryLabel = '';
    
    switch (factor) {
      case 'DonorHb_Cat':
        switch (value) {
          case 1: categoryLabel = 'Donor Hb < 125 g/L'; break;
          case 2: categoryLabel = 'Donor Hb 125-139 g/L'; break;
          case 3: categoryLabel = 'Donor Hb 140-154 g/L'; break;
          case 4: categoryLabel = 'Donor Hb 155-169 g/L'; break;
          case 5: categoryLabel = 'Donor Hb ≥ 170 g/L'; break;
          default: categoryLabel = `Donor Hb Category ${value}`;
        }
        break;
      case 'Storage_Cat':
        switch (value) {
          case 1: categoryLabel = 'Storage < 10 days'; break;
          case 2: categoryLabel = 'Storage 10-19 days'; break;
          case 3: categoryLabel = 'Storage 20-29 days'; break;
          case 4: categoryLabel = 'Storage 30-39 days'; break;
          case 5: categoryLabel = 'Storage ≥ 40 days'; break;
          default: categoryLabel = `Storage Category ${value}`;
        }
        break;
      case 'DonorSex':
        categoryLabel = value === 1 ? 'Male Donor' : value === 2 ? 'Female Donor' : `Donor Sex ${value}`;
        break;
      case 'DonorParity':
        categoryLabel = value === 0 ? 'Nulliparous Donor' : value === 1 ? 'Parous Donor' : `Donor Parity ${value}`;
        break;
      case 'wdy_donation':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        categoryLabel = days[value-1] || `Day ${value}`;
        break;
      default:
        categoryLabel = `${value}`;
    }
    
    return modelType ? `${categoryLabel} (${modelType})` : categoryLabel;
  }
  
  /**
   * Get color for a comparison value with enhanced Stripe-inspired gradients
   * @param {any} value - The comparison value
   * @param {Array} comparisonValues - All available comparison values
   * @param {number} index - Index for alternative coloring
   * @returns {Object} Object with line, area colors and gradient
   */
  function getLineColor(value, comparisonValues, index = 0) {
    // Check if we're in dark mode to adjust color brightness
    const isDarkMode = !document.body.classList.contains('light-theme');
    
    // Tesla × Apple × Stripe × TED Design System colors
    // Enhanced for better visibility in dark mode
    const colors = [
      // Stripe-inspired purple gradient
      {
        line: 'rgb(133, 125, 255)', // Brightened --stripe-purple for dark mode
        area: isDarkMode ? 'rgba(133, 125, 255, 0.25)' : 'rgba(99, 91, 255, 0.15)',
        gradient: {
          start: isDarkMode ? 'rgba(133, 125, 255, 0.7)' : 'rgba(99, 91, 255, 0.7)',
          end: isDarkMode ? 'rgba(170, 140, 255, 0.7)' : 'rgba(156, 98, 255, 0.7)'
        }
      },
      // Tesla-inspired red gradient
      {
        line: 'rgb(255, 75, 80)', // Brightened --tesla-red for dark mode
        area: isDarkMode ? 'rgba(255, 75, 80, 0.25)' : 'rgba(232, 33, 39, 0.15)',
        gradient: {
          start: isDarkMode ? 'rgba(255, 75, 80, 0.7)' : 'rgba(232, 33, 39, 0.7)',
          end: isDarkMode ? 'rgba(255, 115, 125, 0.7)' : 'rgba(255, 75, 89, 0.7)'
        }
      },
      // Apple-inspired blue gradient
      {
        line: 'rgb(64, 156, 255)', // Brightened --apple-blue for dark mode
        area: isDarkMode ? 'rgba(64, 156, 255, 0.25)' : 'rgba(10, 132, 255, 0.15)',
        gradient: {
          start: isDarkMode ? 'rgba(64, 156, 255, 0.7)' : 'rgba(10, 132, 255, 0.7)',
          end: isDarkMode ? 'rgba(128, 187, 255, 0.7)' : 'rgba(96, 165, 250, 0.7)'
        }
      },
      // TED-inspired red gradient
      {
        line: 'rgb(255, 91, 68)', // Brightened --ted-red for dark mode
        area: isDarkMode ? 'rgba(255, 91, 68, 0.25)' : 'rgba(230, 43, 30, 0.15)',
        gradient: {
          start: isDarkMode ? 'rgba(255, 91, 68, 0.7)' : 'rgba(230, 43, 30, 0.7)',
          end: isDarkMode ? 'rgba(255, 120, 100, 0.7)' : 'rgba(255, 91, 68, 0.7)'
        }
      },
      // Green gradient
      {
        line: 'rgb(45, 212, 156)', // Brightened --color-success for dark mode
        area: isDarkMode ? 'rgba(45, 212, 156, 0.25)' : 'rgba(16, 185, 129, 0.15)',
        gradient: {
          start: isDarkMode ? 'rgba(45, 212, 156, 0.7)' : 'rgba(16, 185, 129, 0.7)',
          end: isDarkMode ? 'rgba(56, 225, 170, 0.7)' : 'rgba(5, 150, 105, 0.7)'
        }
      },
      // Orange gradient  
      {
        line: 'rgb(250, 180, 50)', // Brightened --color-warning for dark mode
        area: isDarkMode ? 'rgba(250, 180, 50, 0.25)' : 'rgba(245, 158, 11, 0.15)',
        gradient: {
          start: isDarkMode ? 'rgba(250, 180, 50, 0.7)' : 'rgba(245, 158, 11, 0.7)',
          end: isDarkMode ? 'rgba(255, 200, 85, 0.7)' : 'rgba(217, 119, 6, 0.7)'
        }
      },
      // Purple gradient
      {
        line: 'rgb(160, 120, 255)', // Brightened --chart-color-6 for dark mode
        area: isDarkMode ? 'rgba(160, 120, 255, 0.25)' : 'rgba(139, 92, 246, 0.15)',
        gradient: {
          start: isDarkMode ? 'rgba(160, 120, 255, 0.7)' : 'rgba(139, 92, 246, 0.7)',
          end: isDarkMode ? 'rgba(180, 140, 255, 0.7)' : 'rgba(124, 58, 237, 0.7)'
        }
      }
    ];
    
    if (value === null) {
      // Reference value gets a neutral gradient - brightened for dark mode
      return {
        line: isDarkMode ? 'rgb(160, 166, 178)' : 'rgb(75, 85, 99)',
        area: isDarkMode ? 'rgba(160, 166, 178, 0.25)' : 'rgba(75, 85, 99, 0.15)', 
        gradient: {
          start: isDarkMode ? 'rgba(160, 166, 178, 0.5)' : 'rgba(75, 85, 99, 0.5)',
          end: isDarkMode ? 'rgba(180, 185, 195, 0.5)' : 'rgba(107, 114, 128, 0.5)'
        }
      };
    }
    
    const valueIndex = comparisonValues.indexOf(value);
    if (valueIndex === -1) {
      return colors[index % colors.length];
    }
    
    return colors[valueIndex % colors.length];
  }
  
  /**
   * Create comparison tags for selecting which comparison values to display
   * @param {Array} comparisonValues - All available comparison values
   * @param {Array} selectedComparisons - Currently selected comparison values
   * @param {string} selectedCompFactor - The selected component factor
   * @param {HTMLElement} container - Container element for the tags
   * @param {Function} onTagClick - Callback for when a tag is clicked
   */
  function createComparisonTags(comparisonValues, selectedComparisons, selectedCompFactor, container, onTagClick) {
    container.innerHTML = '';
    
    comparisonValues.forEach(value => {
      const tag = document.createElement('span');
      tag.className = selectedComparisons.includes(value) ? 'tag active' : 'tag';
      tag.textContent = getLegendLabel(value, selectedCompFactor);
      
  tag.addEventListener('click', () => {
    onTagClick(value);
    // Don't update class name here - it will be handled by recreating tags
  });
      
      container.appendChild(tag);
    });
  }
  
  /**
   * Prepare chart data for visualization
   * @param {Object} chartData - Object containing the chart data
   * @param {Array} selectedComparisons - Currently selected comparison values
   * @param {Array} timeRange - Time range [min, max]
   * @param {boolean} showDeltaPlot - Whether to show delta plot
   * @param {boolean} showConfidenceInterval - Whether to show confidence interval
   * @param {boolean} showBaseModel - Whether to show base model
   * @param {string} selectedCompFactor - The selected component factor
   * @param {Array} comparisonValues - All available comparison values
   * @returns {Object|null} Processed chart data or null if no data available
   */
  function prepareChartData(chartData, selectedComparisons, timeRange, showDeltaPlot, showConfidenceInterval, 
                           showBaseModel, selectedCompFactor, comparisonValues) {
    if (!chartData.data || chartData.data.length === 0) return null;
    
    const compColumn = chartData.comparisonColumn;
    
    // Filter data by time range and selected comparison values
    const filteredData = chartData.data.filter(row => 
      row.TimeFromTransfusion >= timeRange[0] && 
      row.TimeFromTransfusion <= timeRange[1]
    );
    
    if (filteredData.length === 0) return null;
    
    // Group by comparison column value
    const groupedByComp = _.groupBy(filteredData, row => {
      const categoryValue = row[compColumn];
      if (categoryValue === null || categoryValue === undefined || categoryValue === '') {
        return 'null';
      }
      return categoryValue;
    });
    
    const datasets = [];
    const allTimes = [];
    const processedCategories = new Set();
    
    // For absolute vs. delta mode
    const valueField = showDeltaPlot ? 'Delta_Full' : 'PredVal_Full';
    const lowerField = showDeltaPlot ? 'Delta_Lower' : 'Lower_Full';
    const upperField = showDeltaPlot ? 'Delta_Upper' : 'Upper_Full';
    const baseField = showDeltaPlot ? 'Delta_Base' : 'PredVal_Base';
    
    // Process each comparison value category
    Object.entries(groupedByComp).forEach(([compValue, rows], index) => {
      const categoryValue = compValue === "null" ? null : 
                            isNaN(parseFloat(compValue)) ? compValue : parseFloat(compValue);
      
      // Skip if not selected
      if (!selectedComparisons.includes(categoryValue)) {
        return;
      }
      processedCategories.add(String(categoryValue));
      
      // Sort rows by time
      const sortedRows = _.sortBy(rows, 'TimeFromTransfusion');
      
      // Collect all time points for x-axis
      sortedRows.forEach(row => {
        if (!allTimes.includes(row.TimeFromTransfusion)) {
          allTimes.push(row.TimeFromTransfusion);
        }
      });
      
      const color = getLineColor(categoryValue, comparisonValues, index);
      const categoryLabel = getLegendLabel(categoryValue, selectedCompFactor);
      
      // Check for main line data
      const hasValidMainData = sortedRows.some(row => 
        row[valueField] !== null && row[valueField] !== undefined
      );
      
      // Check for CI data
      const hasValidCIData = sortedRows.some(row => 
        row[lowerField] !== null && row[lowerField] !== undefined &&
        row[upperField] !== null && row[upperField] !== undefined
      );
      
      // Build the CI dataset(s) if user wants it and data is valid
      if (hasValidMainData) {
        if (showConfidenceInterval && hasValidCIData) {
          // The "lower boundary" dataset (no fill)
          const lowerCIDataset = {
            label: `${categoryLabel} (CI Lower)`,
            data: sortedRows.map(row => ({
              x: row.TimeFromTransfusion,
              y: row[lowerField]
            })),
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            pointRadius: 0,
            fill: false,
            tension: 0.3
          };
          
          // The "upper boundary" dataset (fill down to the lower)
          const upperCIDataset = {
            label: `${categoryLabel} (CI Upper)`,
            data: sortedRows.map(row => ({
              x: row.TimeFromTransfusion,
              y: row[upperField]
            })),
            borderColor: 'transparent',
            backgroundColor: color.area,
            pointRadius: 0,
            fill: '-1', // fill to the previous dataset
            tension: 0.3
          };
          
          // Then the main "Full" line itself
          const mainLineDataset = {
            label: `${categoryLabel} (Full)`,
            data: sortedRows.map(row => ({
              x: row.TimeFromTransfusion,
              y: row[valueField]
            })),
            borderColor: color.line,
            backgroundColor: color.line,
            borderWidth: document.body.classList.contains('light-theme') ? 2 : 3, // Thicker lines in dark mode
            tension: 0.3,
            fill: false,
            pointRadius: 0
          };
          
          // Push in the correct order to create a band
          datasets.push(lowerCIDataset);
          datasets.push(upperCIDataset);
          datasets.push(mainLineDataset);
          
        } else {
          // If no CI or invalid CI, just push the main line
          datasets.push({
            label: `${categoryLabel} (Full)`,
            data: sortedRows.map(row => ({
              x: row.TimeFromTransfusion,
              y: row[valueField]
            })),
            borderColor: color.line,
            backgroundColor: color.line,
            borderWidth: document.body.classList.contains('light-theme') ? 2 : 3, // Thicker lines in dark mode
            tension: 0.3,
            fill: false,
            pointRadius: 0
          });
        }
      }
      
      // Base model line
      const hasValidBaseData = sortedRows.some(row => 
        row[baseField] !== null && row[baseField] !== undefined
      );
      
      if (showBaseModel && hasValidBaseData) {
        datasets.push({
          label: `${categoryLabel} (Base)`,
          data: sortedRows.map(row => ({
            x: row.TimeFromTransfusion,
            y: row[baseField]
          })),
          borderColor: color.line,
          backgroundColor: color.line,
          borderWidth: document.body.classList.contains('light-theme') ? 1.5 : 2.5, // Thicker lines for dark mode
          borderDash: [5, 5],
          tension: 0.3,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 2
        });
      }
    });
    
    if (processedCategories.size === 0) {
      return null;
    }
    
    // Sort time points for consistent x-axis
    allTimes.sort((a, b) => a - b);
    
    return {
      datasets: datasets,
      allTimes: allTimes
    };
  }
  
  /**
   * Create and render a chart with the prepared data
   * @param {Object} chartData - Prepared chart data
   * @param {Object} metaInfo - Metadata for the chart
   * @param {Array} timeRange - Time range [min, max]
   * @param {boolean} showDeltaPlot - Whether to show delta plot
   * @param {string} selectedVital - Selected vital parameter
   * @param {Chart|null} existingChart - Existing chart instance, if any
   * @returns {Chart} New or updated chart instance
   */
  function renderChart(chartData, metaInfo, timeRange, showDeltaPlot, selectedVital, existingChart) {
    // Clear existing chart if no data
    if (!chartData) {
      if (existingChart) {
        existingChart.destroy();
      }
      return null;
    }
    
    const ctx = document.getElementById('chart-canvas').getContext('2d');
    
    // Find min and max values including confidence intervals
    let minY = Infinity;
    let maxY = -Infinity;
    
    // First pass: scan all datasets for extreme values
    chartData.datasets.forEach(dataset => {
      dataset.data.forEach(point => {
        if (point.y !== null && !isNaN(point.y)) {
          minY = Math.min(minY, point.y);
          maxY = Math.max(maxY, point.y);
        }
      });
    });
    
    // Data-driven approach: Use actual min/max with exactly 5% padding
    const dataRange = maxY - minY;
    
    // Check if this is SpO2 data which often has very small variations
    const isSpO2 = selectedVital && selectedVital.trim() === 'SpO2';
    
    // Calculate exact 5% padding of the data range
    const paddingAmount = dataRange * 0.05;
    
    // Apply a much smaller absolute minimum padding for SpO2 in delta mode
    let minPadding;
    if (isSpO2 && showDeltaPlot) {
      minPadding = 0.01; // Much smaller minimum for SpO2 delta plots
    } else {
      minPadding = 0.05; // Normal minimum for other plots
    }
    
    // Use exact 5% padding unless range is extremely small
    const paddingTop = Math.max(paddingAmount, minPadding);
    const paddingBottom = Math.max(paddingAmount, minPadding);
    
    // Start with exact min/max of data plus the 5% padding
    let yMin = minY - paddingBottom;
    let yMax = maxY + paddingTop;
    
    // Only apply these special conditions if needed
    if (!showDeltaPlot) {
      // Absolute mode: ensure we don't go below 0
      yMin = Math.max(0, yMin);
      
      // For absolute SpO2, cap at 100% as maximum physiological value
      if (isSpO2 && yMax > 99) {
        yMax = 100;
      }
    } else if (isSpO2) {
      // For SpO2 delta plots, use a much tighter range - they have very small variations
      const minSpO2Range = dataRange * 1.5; // Ensure range is at least 1.5x the data range
      if (yMax - yMin < minSpO2Range) {
        const center = (yMax + yMin) / 2;
        yMin = center - (minSpO2Range / 2);
        yMax = center + (minSpO2Range / 2);
      }
    } else {
      // For other vital signs in delta mode, ensure zero is always included if data is near zero
      if (minY > 0 && minY < dataRange * 0.2) {
        yMin = 0;
      } else if (maxY < 0 && maxY > -dataRange * 0.2) {
        yMax = 0;
      }
      
      // Apply a minimum range for all other vitals (except SpO2)
      const minRegularRange = 0.5; // Half a unit minimum range for most vitals
      if (yMax - yMin < minRegularRange) {
        const center = (yMax + yMin) / 2;
        yMin = center - (minRegularRange / 2);
        yMax = center + (minRegularRange / 2);
      }
    }
    
    // Round to clean values to avoid awkward tick labels
    const roundToNearestHalf = (num) => {
      // To nearest 0.5 for small values, to nearest 1 for larger values
      const precision = Math.abs(num) < 10 ? 0.5 : 1;
      return Math.round(num / precision) * precision;
    };
    
    // Round bounds to nice values but preserve the spacing
    const rawRange = yMax - yMin;
    yMin = roundToNearestHalf(yMin);
    yMax = yMin + roundToNearestHalf(rawRange);
    
    // Update chart title
    document.getElementById('chart-title').innerHTML = `
      <h2>${showDeltaPlot ? 'Change in ' : ''}${metaInfo.vitalName} by ${metaInfo.compName}</h2>
    `;
    
    if (existingChart) {
      existingChart.destroy();
    }
    
    const usedYLabels = new Set();
    
    // Create enhanced chart with modern styling
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: chartData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
          scales: {
            x: {
              type: 'linear',
              title: {
                display: true,
                text: 'Time From Transfusion (minutes)',
                font: {
                  family: "'Inter', sans-serif",
                  size: 13, // Slightly larger for better readability
                  weight: 500
                },
                color: document.body.classList.contains('light-theme') ? 
                       'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)' // Enhanced contrast for dark mode
              },
              min: timeRange[0],
              max: timeRange[1],
              grid: {
                // Higher opacity grid lines for better visibility in dark mode
                color: document.body.classList.contains('light-theme') ? 
                      'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.15)'
              },
              ticks: {
                font: {
                  size: 11, // Slightly larger tick font
                  weight: document.body.classList.contains('light-theme') ? 400 : 500 // Bolder in dark mode
                },
                color: document.body.classList.contains('light-theme') ? 
                       'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)' // Enhanced contrast for dark mode
              }
            },
            y: {
              title: {
                display: true,
                text: showDeltaPlot ? metaInfo.DeltaYLabel : metaInfo.yLabel,
                font: {
                  family: "'Inter', sans-serif",
                  size: 13, // Slightly larger for better readability
                  weight: 500
                },
                color: document.body.classList.contains('light-theme') ? 
                       'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)' // Enhanced contrast for dark mode
              },
              min: yMin,
              max: yMax,
              grid: {
                // Higher opacity grid lines for better visibility in dark mode
                color: document.body.classList.contains('light-theme') ? 
                       'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.15)'
              },
              ticks: {
                count: 5,
                callback: (value, index, values) => {
                  // Always use one decimal place for consistency
                  let formattedValue = value.toFixed(1);
                  
                  // Avoid -0.0 display
                  if (formattedValue === "-0.0") formattedValue = "0.0";
                  
                  // Check if this formatted value would be a duplicate
                  if (usedYLabels.has(formattedValue)) {
                    return null; // Skip duplicate
                  }
                  
                  // Add to used labels set
                  usedYLabels.add(formattedValue);
                  
                  // Clear the set when we reach the end of the axis ticks
                  if (index === values.length - 1) {
                    usedYLabels.clear();
                  }
                  
                  return formattedValue;
                },
                display: true,
                font: {
                  size: 11,
                  weight: document.body.classList.contains('light-theme') ? 400 : 500 // Bolder in dark mode
                },
                color: document.body.classList.contains('light-theme') ? 
                       'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)' // Enhanced contrast for dark mode
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                font: {
                  family: "'Inter', sans-serif",
                  size: 12,
                  weight: document.body.classList.contains('light-theme') ? 400 : 500 // Bolder in dark mode
                },
                color: document.body.classList.contains('light-theme') ? 
                       'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 1.0)', // Maximum contrast for legend
                filter: function(legendItem) {
                  // Hide "CI Upper" and "CI Lower" from legend
                  return !legendItem.text.includes('CI Upper') && !legendItem.text.includes('CI Lower');
                },
                padding: 15,
                boxWidth: document.body.classList.contains('light-theme') ? 12 : 15 // Larger color boxes in dark mode
              }
            },
            tooltip: {
              backgroundColor: document.body.classList.contains('light-theme') ? 
                               'var(--bg-card)' : 'rgba(30, 30, 30, 0.95)', // Darker in dark mode for contrast
              titleFont: {
                family: "'Inter', sans-serif",
                size: 13,
                weight: 600
              },
              bodyFont: {
                family: "'Inter', sans-serif",
                size: 12
              },
              borderColor: document.body.classList.contains('light-theme') ? 
                          'var(--border-subtle)' : 'rgba(255, 255, 255, 0.2)', // More visible border in dark mode
              borderWidth: 1,
              padding: 10,
              titleColor: document.body.classList.contains('light-theme') ? 
                          'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 1.0)', // Better title contrast
              bodyColor: document.body.classList.contains('light-theme') ? 
                         'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)', // Better body text contrast
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
                }
              }
            }
          }
      }
    });
    
    // Add SVG export button functionality
    const exportSvgBtn = document.getElementById('export-svg-btn');
    if (exportSvgBtn) {
      exportSvgBtn.onclick = function() {
        const filename = `${metaInfo.vitalName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_by_${metaInfo.compName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
        exportChartAsSVG(chart, filename);
      };
    }
    
    return chart;
  }
