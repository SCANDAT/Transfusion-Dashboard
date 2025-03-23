/**
 * RBC Transfusions tab functionality for the Transfusion Dashboard
 */

/**
 * Create the content for the RBC Transfusions tab
 * @returns {string} HTML content for the RBC Transfusions tab
 */
function createRbcTransfusionsContent() {
  return `
    <div class="card controls">
      <div class="form-group">
        <label class="form-label">Time Range (minutes):</label>
        <div style="display: flex; align-items: center; gap: 10px;">
          <input type="number" id="transfusion-time-min" class="form-input" style="width: 80px;" value="0">
          <span>to</span>
          <input type="number" id="transfusion-time-max" class="form-input" style="width: 80px;" value="720">
          <button id="transfusion-time-reset" class="btn btn-sm">Reset</button>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Display Options:</label>
        <div style="display: flex; gap: 20px;">
          <label>
            <input type="checkbox" id="transfusion-show-ci" checked> Show Confidence Interval
          </label>
          <label>
            <input type="checkbox" id="transfusion-show-base"> Show Base Model
          </label>
          <label>
            <input type="checkbox" id="transfusion-show-delta" checked> Show Change from Baseline
          </label>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Vital Parameters:</label>
        <div id="vital-param-buttons" class="button-group"></div>
      </div>
    </div>
    
    <div id="transfusion-plots-container" class="plots-container">
      <!-- Dynamic plots will be inserted here -->
    </div>
    
    <div class="card info-card">
      <div id="model-info" class="info" style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: center; gap: 20px;">
          <div style="padding: 5px 10px; border-left: 4px solid #3b82f6;">
            <span style="font-weight: bold;">Base Model:</span> A mixed-effects model with a random intercept for patient ID that adjusts for time from transfusion (natural cubic spline with fixed knots at -660, -360, -60, 0, 60, 360, and 660 minutes), patient age and time spent in the ICU prior to transfusion (natural cubic splines with three percentile-based knots), RBC transfusion count, patient sex, and ICU ward name
          </div>
          <div style="padding: 5px 10px; border-left: 4px solid #3b82f6;">
            <span style="font-weight: bold;">Fully Adjusted Model:</span> A mixed-effects model containing all base model variables as well as cumulative crystalloid fluids and vasopressors administered (in ml) in the last 1 and 24 hours prior to transfusion (natural cubic splines with three percentile-based knots), and a binary variable for whether sedatives were administered in the last 1 and 24 hours prior to transfusion 
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize the RBC Transfusions tab
 * @param {string} containerId - ID of the container element
 * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
 * @param {Function} logDebug - Debug logging function
 */
function initializeRbcTransfusions(containerId, fileCase, logDebug) {
  const container = document.getElementById(containerId);
  if (!container) {
    logDebug('Cannot initialize RBC Transfusions: container not found');
    return;
  }
  
  // State for this module
  const state = {
    timeRange: [0, 720],
    showConfidenceInterval: true,
    showBaseModel: false,
    showDeltaPlot: true,
    selectedVitalParams: ['ARTm'], // Start with Mean Arterial Pressure selected
    charts: {},
    fileCase: fileCase,
    logDebug: logDebug,
    loadingElement: null,
    vitalParamInfo: [
      { value: 'ARTm', label: 'Mean Arterial Pressure (mmHg)', abbreviation: 'MAP', color: '#3b82f6' },
      { value: 'ARTs', label: 'Systolic Blood Pressure (mmHg)', abbreviation: 'SBP', color: '#ef4444' },
      { value: 'ARTd', label: 'Diastolic Blood Pressure (mmHg)', abbreviation: 'DBP', color: '#10b981' },
      { value: 'HR', label: 'Heart Rate (bpm)', abbreviation: 'HR', color: '#f59e0b' },
      { value: 'FIO2', label: 'Fraction of Inspired Oxygen (%)', abbreviation: 'FiO2', color: '#8b5cf6' },
      { value: 'SpO2', label: 'Peripheral Capillary Oxygen Saturation (%)', abbreviation: 'SpO2', color: '#ec4899' },
      { value: 'VE', label: 'Minute Ventilation (L/min)', abbreviation: 'VE', color: '#6366f1' }
    ]
  };
  
  // Create button controls for vital parameters
  createVitalParamButtons(state);
  
  // Add event listeners
  addEventListeners(state);
  
  // Load and render the initial vital parameter (MAP)
  loadVitalParameterData(state, 'ARTm');
  
  logDebug('RBC Transfusions tab initialized');
}

/**
 * Create buttons for vital parameter selection
 * @param {Object} state - Module state
 */
function createVitalParamButtons(state) {
  const buttonContainer = document.getElementById('vital-param-buttons');
  if (!buttonContainer) return;
  
  buttonContainer.innerHTML = '';
  
  state.vitalParamInfo.forEach(param => {
    const button = document.createElement('button');
    button.className = state.selectedVitalParams.includes(param.value) ? 
      'vital-param-button active' : 'vital-param-button';
    button.dataset.value = param.value;
    button.innerHTML = `
      <span class="color-indicator" style="background-color: ${param.color}"></span>
      <span class="button-label">${param.label}</span>
    `;
    
    button.addEventListener('click', () => toggleVitalParameter(state, param.value));
    buttonContainer.appendChild(button);
  });
}

/**
 * Toggle a vital parameter selection
 * @param {Object} state - Module state
 * @param {string} vitalParam - Vital parameter code
 */
function toggleVitalParameter(state, vitalParam) {
  const index = state.selectedVitalParams.indexOf(vitalParam);
  
  if (index === -1) {
    // Parameter is not selected, add it
    state.selectedVitalParams.push(vitalParam);
    
    // Load data for this parameter
    loadVitalParameterData(state, vitalParam);
  } else {
    // Parameter is already selected, remove it
    state.selectedVitalParams.splice(index, 1);
    
    // Remove chart
    removeVitalParameterPlot(state, vitalParam);
  }
  
  // Update button states
  updateButtonStates(state);
}

/**
 * Update vital parameter button states
 * @param {Object} state - Module state
 */
function updateButtonStates(state) {
  state.vitalParamInfo.forEach(param => {
    const button = document.querySelector(`.vital-param-button[data-value="${param.value}"]`);
    if (button) {
      button.className = state.selectedVitalParams.includes(param.value) ? 
        'vital-param-button active' : 'vital-param-button';
    }
  });
}

/**
 * Add event listeners for the controls
 * @param {Object} state - Module state
 */
function addEventListeners(state) {
  // Time range controls
  document.getElementById('transfusion-time-min').addEventListener('change', (e) => {
    state.timeRange[0] = parseInt(e.target.value);
    updateAllCharts(state);
  });
  
  document.getElementById('transfusion-time-max').addEventListener('change', (e) => {
    state.timeRange[1] = parseInt(e.target.value);
    updateAllCharts(state);
  });
  
  document.getElementById('transfusion-time-reset').addEventListener('click', () => {
    state.timeRange = [0, 720];
    document.getElementById('transfusion-time-min').value = 0;
    document.getElementById('transfusion-time-max').value = 720;
    updateAllCharts(state);
  });
  
  // Display options
  document.getElementById('transfusion-show-ci').addEventListener('change', (e) => {
    state.showConfidenceInterval = e.target.checked;
    updateAllCharts(state);
  });
  
  document.getElementById('transfusion-show-base').addEventListener('change', (e) => {
    state.showBaseModel = e.target.checked;
    updateAllCharts(state);
  });
  
  document.getElementById('transfusion-show-delta').addEventListener('change', (e) => {
    state.showDeltaPlot = e.target.checked;
    updateAllCharts(state);
  });
}

/**
 * Load data for a specific vital parameter
 * @param {Object} state - Module state
 * @param {string} vitalParam - Vital parameter code
 */
async function loadVitalParameterData(state, vitalParam) {
  showLoading(state);
  
  try {
    // Load the standard transfusion data
    const standardData = await loadTransfusionData(vitalParam, state.fileCase, state.logDebug);
    
    // Create or update the plot pair
    createOrUpdatePlotPair(state, vitalParam, standardData);
    
    // Also load LOESS data if needed
    try {
      const loessData = await loadLoessData(vitalParam, state.fileCase, state.logDebug);
      
      // Update the LOESS part of the plot pair
      updateLoessPlot(state, vitalParam, loessData);
    } catch (loessError) {
      state.logDebug(`Error loading LOESS data for ${vitalParam}: ${loessError.message}`);
      // Continue without LOESS data - just show transfusion data
    }
  } catch (error) {
    state.logDebug(`Failed to load data for ${vitalParam}: ${error.message}`);
    const container = document.getElementById('transfusion-plots-container');
    showError(`Failed to load data for ${getVitalParamLabel(state, vitalParam)}: ${error.message}`, container);
  } finally {
    hideLoading(state);
  }
}

/**
 * Create or update a plot pair (standard + LOESS) for a vital parameter
 * @param {Object} state - Module state
 * @param {string} vitalParam - Vital parameter code
 * @param {Object} data - Visualization data
 */
function createOrUpdatePlotPair(state, vitalParam, data) {
  const plotsContainer = document.getElementById('transfusion-plots-container');
  const paramInfo = getVitalParamInfo(state, vitalParam);
  
  // Check if plot pair already exists
  let plotPairContainer = document.getElementById(`plot-pair-${vitalParam}`);
  
  if (!plotPairContainer) {
    // Create a new plot pair container
    plotPairContainer = document.createElement('div');
    plotPairContainer.id = `plot-pair-${vitalParam}`;
    plotPairContainer.className = 'plot-pair';
    plotPairContainer.innerHTML = `
      <div class="plot-pair-header">
        <h3>${paramInfo.label}</h3>
      </div>
      <div class="plot-pair-content">
        <div class="plot-container standard-plot">
          <div class="plot-title">Transfusion Effect</div>
          <canvas id="chart-${vitalParam}"></canvas>
        </div>
        <div class="plot-container loess-plot">
          <div class="plot-title">LOESS Analysis</div>
          <canvas id="loess-chart-${vitalParam}"></canvas>
        </div>
      </div>
    `;
    
    // Add to container
    plotsContainer.appendChild(plotPairContainer);
  }
  
  // Render the standard plot
  const ctx = document.getElementById(`chart-${vitalParam}`).getContext('2d');
  
  // Prepare data for Chart.js
  const chartData = prepareTransfusionChartData(
    data,
    state.timeRange,
    state.showDeltaPlot,
    state.showConfidenceInterval,
    state.showBaseModel
  );
  
  if (state.charts[vitalParam]) {
    state.charts[vitalParam].destroy();
  }
  
  state.charts[vitalParam] = renderTransfusionChart(
    ctx,
    chartData,
    data.metaInfo,
    state.timeRange,
    state.showDeltaPlot,
    vitalParam
  );
}

/**
 * Update the LOESS plot for a vital parameter
 * @param {Object} state - Module state
 * @param {string} vitalParam - Vital parameter code
 * @param {Object} data - LOESS data
 */
function updateLoessPlot(state, vitalParam, data) {
  const ctx = document.getElementById(`loess-chart-${vitalParam}`).getContext('2d');
  
  // Debug: Log data structure before preparing chart data
  state.logDebug(`Preparing LOESS chart data for ${vitalParam} with ${data.data.length} rows`);
  
  const chartData = prepareLoessChartData(
    data,
    state.timeRange
  );
  
  if (chartData) {
    state.logDebug(`LOESS chart data prepared successfully with ${chartData.datasets[0].data.length} points`);
  } else {
    state.logDebug(`Failed to prepare LOESS chart data - null or empty result`);
  }
  
  if (state.charts[`loess-${vitalParam}`]) {
    state.charts[`loess-${vitalParam}`].destroy();
  }
  
  state.charts[`loess-${vitalParam}`] = renderLoessChart(
    ctx,
    chartData,
    data.metaInfo,
    state.timeRange,
    vitalParam
  );
}

/**
 * Remove a vital parameter's plot pair
 * @param {Object} state - Module state
 * @param {string} vitalParam - Vital parameter code
 */
function removeVitalParameterPlot(state, vitalParam) {
  // Destroy charts
  if (state.charts[vitalParam]) {
    state.charts[vitalParam].destroy();
    delete state.charts[vitalParam];
  }
  
  if (state.charts[`loess-${vitalParam}`]) {
    state.charts[`loess-${vitalParam}`].destroy();
    delete state.charts[`loess-${vitalParam}`];
  }
  
  // Remove plot container
  const plotPairContainer = document.getElementById(`plot-pair-${vitalParam}`);
  if (plotPairContainer) {
    plotPairContainer.remove();
  }
}

/**
 * Update all charts with current settings
 * @param {Object} state - Module state
 */
function updateAllCharts(state) {
  state.selectedVitalParams.forEach(vitalParam => {
    loadVitalParameterData(state, vitalParam);
  });
}

/**
 * Load transfusion data for a specific vital parameter
 * @param {string} vitalParam - Vital parameter code
 * @param {string} fileCase - File case style
 * @param {Function} logDebug - Debug logging function
 * @returns {Promise<Object>} Visualization data
 */
async function loadTransfusionData(vitalParam, fileCase, logDebug) {
  if (!vitalParam) {
    throw new Error("Vital parameter is not specified");
  }
  
  try {
    const baseFileName = `VIZ_${vitalParam.trim().toUpperCase()}_TRANSFUSION`;
    logDebug(`Base transfusion filename: ${baseFileName}`);
    
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
          
          logDebug(`Parsed ${results.data.length} rows of transfusion data for ${vitalParam}`);
          
          // Extract metadata from the first row
          const firstRow = results.data[0];
          const metaInfo = {
            vitalName: firstRow.VitalName || "Vital Parameter",
            yLabel: firstRow.YLabel || "Value",
            DeltaYLabel: firstRow.DeltaYLabel || "Change in Value"
          };
          
          resolve({
            data: results.data,
            metaInfo: metaInfo,
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
    logDebug(`Failed to load transfusion data: ${error.message}`);
    throw error;
  }
}

/**
 * Load LOESS data for a specific vital parameter
 * @param {string} vitalParam - Vital parameter code
 * @param {string} fileCase - File case style
 * @param {Function} logDebug - Debug logging function
 * @returns {Promise<Object>} LOESS data
 */
async function loadLoessData(vitalParam, fileCase, logDebug) {
  if (!vitalParam) {
    throw new Error("Vital parameter is not specified");
  }
  
  try {
    // For now, assume all LOESS data comes from the single LOESS file
    const baseFileName = 'VIZ_LOESS';
    logDebug(`Loading LOESS data from: ${baseFileName}`);
    
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
            reject(new Error("No data found in the LOESS CSV file"));
            return;
          }
          
          // Debug: Log the first row to see its structure
          if (results.data.length > 0) {
            logDebug(`LOESS data first row example: ${JSON.stringify(results.data[0])}`);
            logDebug(`Available columns: ${Object.keys(results.data[0]).join(', ')}`);
          }
          
          // Filter to just this vital parameter
          const filteredData = results.data.filter(row => 
            row.VitalParam && row.VitalParam.trim() === vitalParam
          );
          
          if (filteredData.length === 0) {
            logDebug(`No rows matched vital parameter "${vitalParam}". Available parameters: ${[...new Set(results.data.map(row => row.VitalParam))].join(', ')}`);
            reject(new Error(`No LOESS data found for ${vitalParam}`));
            return;
          }
          
          logDebug(`Parsed ${filteredData.length} rows of LOESS data for ${vitalParam}`);
          
          // Debug: Log a sample of the filtered data
          if (filteredData.length > 0) {
            logDebug(`LOESS filtered data sample: TimeFromTransfusion=${filteredData[0].TimeFromTransfusion}, PredVal_Full=${filteredData[0].PredVal_Full}`);
          }
          
          // Extract metadata from the first row
          const firstRow = filteredData[0];
          const metaInfo = {
            vitalName: firstRow.VitalName || "Vital Parameter",
            yLabel: firstRow.YLabel || "Z-Score"
          };
          
          resolve({
            data: filteredData,
            metaInfo: metaInfo,
            currentFileName: currentFileName
          });
        },
        error: (error) => {
          logDebug(`LOESS CSV parse error: ${error.message}`);
          reject(new Error(`LOESS CSV parse error: ${error.message}`));
        }
      });
    });
  } catch (error) {
    logDebug(`Failed to load LOESS data: ${error.message}`);
    throw error;
  }
}

/**
 * Prepare transfusion data for Chart.js
 * @param {Object} data - The visualization data
 * @param {Array} timeRange - Time range [min, max]
 * @param {boolean} showDeltaPlot - Whether to show delta plot
 * @param {boolean} showConfidenceInterval - Whether to show confidence interval
 * @param {boolean} showBaseModel - Whether to show base model
 * @returns {Object|null} Processed chart data or null if no data available
 */
function prepareTransfusionChartData(data, timeRange, showDeltaPlot, showConfidenceInterval, showBaseModel) {
  if (!data.data || data.data.length === 0) return null;
  
  // Filter data by time range
  const filteredData = data.data.filter(row => 
    row.TimeFromTransfusion >= timeRange[0] && 
    row.TimeFromTransfusion <= timeRange[1]
  );
  
  if (filteredData.length === 0) return null;
  
  // Sort by time
  const sortedData = _.sortBy(filteredData, 'TimeFromTransfusion');
  
  // Prepare fields based on delta/absolute mode
  const valueField = showDeltaPlot ? 'Delta_Full' : 'PredVal_Full';
  const lowerField = showDeltaPlot ? 'Delta_Lower' : 'Lower_Full';
  const upperField = showDeltaPlot ? 'Delta_Upper' : 'Upper_Full';
  const baseField = showDeltaPlot ? 'Delta_Base' : 'PredVal_Base';
  
  const datasets = [];
  
  // Main line color and area
  const mainColor = {
    line: 'rgb(31, 119, 180)',
    area: 'rgba(31, 119, 180, 0.2)'
  };
  
  // Check for main line data
  const hasValidMainData = sortedData.some(row => 
    row[valueField] !== null && row[valueField] !== undefined
  );
  
  // Check for CI data
  const hasValidCIData = sortedData.some(row => 
    row[lowerField] !== null && row[lowerField] !== undefined &&
    row[upperField] !== null && row[upperField] !== undefined
  );
  
  if (hasValidMainData) {
    if (showConfidenceInterval && hasValidCIData) {
      // Lower CI boundary (no fill)
      datasets.push({
        label: `CI Lower`,
        data: sortedData.map(row => ({
          x: row.TimeFromTransfusion,
          y: row[lowerField]
        })),
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        pointRadius: 0,
        fill: false,
        tension: 0.3
      });
      
      // Upper CI boundary (fill to lower)
      datasets.push({
        label: `CI Upper`,
        data: sortedData.map(row => ({
          x: row.TimeFromTransfusion,
          y: row[upperField]
        })),
        borderColor: 'transparent',
        backgroundColor: mainColor.area,
        pointRadius: 0,
        fill: '-1', // fill to the previous dataset
        tension: 0.3
      });
    }
    
    // Main line
    datasets.push({
      label: `Fully Adjusted Model`,
      data: sortedData.map(row => ({
        x: row.TimeFromTransfusion,
        y: row[valueField]
      })),
      borderColor: mainColor.line,
      backgroundColor: mainColor.line,
      borderWidth: 2,
      tension: 0.3,
      fill: false,
      pointRadius: 0
    });
  }
  
  // Base model line
  const hasValidBaseData = sortedData.some(row => 
    row[baseField] !== null && row[baseField] !== undefined
  );
  
  if (showBaseModel && hasValidBaseData) {
    datasets.push({
      label: `Base Model`,
      data: sortedData.map(row => ({
        x: row.TimeFromTransfusion,
        y: row[baseField]
      })),
      borderColor: 'rgb(220, 38, 38)', // Red color for base model
      backgroundColor: 'rgb(220, 38, 38)',
      borderWidth: 1.5,
      borderDash: [5, 5],
      tension: 0.3,
      fill: false,
      pointRadius: 0
    });
  }
  
  return {
    datasets: datasets
  };
}

/**
 * Prepare LOESS data for Chart.js
 * @param {Object} data - The LOESS data
 * @param {Array} timeRange - Time range [min, max]
 * @returns {Object|null} Processed chart data or null if no data available
 */
function prepareLoessChartData(data, timeRange) {
  if (!data.data || data.data.length === 0) return null;
  
  // Filter data by time range
  const filteredData = data.data.filter(row => 
    row.TimeFromTransfusion >= timeRange[0] && 
    row.TimeFromTransfusion <= timeRange[1]
  );
  
  if (filteredData.length === 0) return null;
  
  // Sort by time
  const sortedData = _.sortBy(filteredData, 'TimeFromTransfusion');
  
  // Z-Score line - using PredVal_Full instead of ZScore which doesn't exist
  const dataset = {
    label: 'Z-Score',
    data: sortedData.map(row => ({
      x: row.TimeFromTransfusion,
      y: row.PredVal_Full
    })),
    borderColor: 'rgb(124, 58, 237)', // Purple for LOESS
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 2,
    tension: 0.3,
    fill: false,
    pointRadius: 0
  };
  
  return {
    datasets: [dataset]
  };
}

/**
 * Render a transfusion chart
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} chartData - Prepared chart data
 * @param {Object} metaInfo - Metadata
 * @param {Array} timeRange - Time range [min, max]
 * @param {boolean} showDeltaPlot - Whether showing delta
 * @param {string} vitalParam - Vital parameter code
 * @returns {Chart} Chart instance
 */
function renderTransfusionChart(ctx, chartData, metaInfo, timeRange, showDeltaPlot, vitalParam) {
  if (!chartData) return null;
  
  // Calculate y-axis range
  let minY = Infinity;
  let maxY = -Infinity;
  
  chartData.datasets.forEach(dataset => {
    dataset.data.forEach(point => {
      if (point.y !== null && !isNaN(point.y)) {
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }
    });
  });
  
  // Add padding
  const range = maxY - minY;
  const padding = range * 0.1;
  let yMin = minY - padding;
  let yMax = maxY + padding;
  
  // Draw red vertical line at time 0 (transfusion time)
  const verticalLinePlugin = {
    id: 'verticalLine',
    beforeDraw: (chart) => {
      if (chart.tooltip._active && chart.tooltip._active.length) {
        return;
      }
      
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      const zeroPos = xAxis.getPixelForValue(0);
      
      // Only draw if zero is in the visible range
      if (zeroPos >= xAxis.left && zeroPos <= xAxis.right) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(zeroPos, yAxis.top);
        ctx.lineTo(zeroPos, yAxis.bottom);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.stroke();
        ctx.restore();
      }
    }
  };
  
  return new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'nearest',
        intersect: false
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
            color: 'var(--text-secondary)'
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
              size: 11 // Slightly larger tick font
            },
            color: 'var(--text-secondary)'
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
            color: 'var(--text-secondary)'
          },
          min: yMin,
          max: yMax,
          grid: {
            // Higher opacity grid lines for better visibility in dark mode
            color: document.body.classList.contains('light-theme') ? 
                  'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.15)'
          },
          ticks: {
            color: 'var(--text-secondary)',
            font: {
              size: 11
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            filter: function(legendItem) {
              // Hide "CI Upper" from legend
              return !legendItem.text.includes('CI Upper');
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
            }
          }
        }
      }
    },
    plugins: [verticalLinePlugin]
  });
}

/**
 * Render a LOESS chart
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} chartData - Prepared chart data
 * @param {Object} metaInfo - Metadata
 * @param {Array} timeRange - Time range [min, max]
 * @param {string} vitalParam - Vital parameter code
 * @returns {Chart} Chart instance
 */
function renderLoessChart(ctx, chartData, metaInfo, timeRange, vitalParam) {
  if (!chartData) return null;
  
  // Calculate y-axis range
  let minY = Infinity;
  let maxY = -Infinity;
  
  chartData.datasets.forEach(dataset => {
    dataset.data.forEach(point => {
      if (point.y !== null && !isNaN(point.y)) {
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }
    });
  });
  
  // Add padding
  const range = maxY - minY;
  const padding = range * 0.1;
  let yMin = minY - padding;
  let yMax = maxY + padding;
  
  // Draw red vertical line at time 0 (transfusion time)
  const verticalLinePlugin = {
    id: 'verticalLine',
    beforeDraw: (chart) => {
      if (chart.tooltip._active && chart.tooltip._active.length) {
        return;
      }
      
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      const zeroPos = xAxis.getPixelForValue(0);
      
      // Only draw if zero is in the visible range
      if (zeroPos >= xAxis.left && zeroPos <= xAxis.right) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(zeroPos, yAxis.top);
        ctx.lineTo(zeroPos, yAxis.bottom);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.stroke();
        ctx.restore();
      }
    }
  };
  
  return new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'nearest',
        intersect: false
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
            color: 'var(--text-secondary)'
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
              size: 11 // Slightly larger tick font
            },
            color: 'var(--text-secondary)'
          }
        },
        y: {
          title: {
            display: true,
            text: metaInfo.yLabel,
            font: {
              family: "'Inter', sans-serif",
              size: 13, // Slightly larger for better readability
              weight: 500
            },
            color: 'var(--text-secondary)'
          },
          min: yMin,
          max: yMax,
          grid: {
            // Higher opacity grid lines for better visibility in dark mode
            color: document.body.classList.contains('light-theme') ? 
                  'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.15)'
          },
          ticks: {
            color: 'var(--text-secondary)',
            font: {
              size: 11
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      }
    },
    plugins: [verticalLinePlugin]
  });
}

/**
 * Get the human-readable label for a vital parameter
 * @param {Object} state - Module state
 * @param {string} vitalParam - Vital parameter code
 * @returns {string} Human-readable label
 */
function getVitalParamLabel(state, vitalParam) {
  const paramInfo = getVitalParamInfo(state, vitalParam);
  return paramInfo ? paramInfo.label : vitalParam;
}

/**
 * Get vital parameter info object
 * @param {Object} state - Module state
 * @param {string} vitalParam - Vital parameter code
 * @returns {Object|null} Vital parameter info object
 */
function getVitalParamInfo(state, vitalParam) {
  return state.vitalParamInfo.find(param => param.value === vitalParam) || null;
}

/**
 * Show loading indicator
 * @param {Object} state - Module state
 */
function showLoading(state) {
  // Create a loading indicator
  const container = document.getElementById('transfusion-plots-container');
  if (!container) return;
  
  // Only create if it doesn't exist
  if (!state.loadingElement) {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.textContent = 'Loading data...';
    container.appendChild(loadingElement);
    state.loadingElement = loadingElement;
  }
}

/**
 * Hide loading indicator
 * @param {Object} state - Module state
 */
function hideLoading(state) {
  if (state && state.loadingElement) {
    state.loadingElement.remove();
    state.loadingElement = null;
  }
}
