/**
 * RBC Component Factors tab functionality for the Transfusion Dashboard
 * 
 * Note: This tab actually displays component factors (not transfusions),
 * using the existing visualization.js functionality.
 */

/**
 * Create the content for the RBC Component Factors tab
 * @returns {string} HTML content for the RBC Component Factors tab
 */
function createRbcComponentFactorsContent() {
  return `
    <div class="card compact-controls">
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
                <label class="form-label">Vital Parameters:</label>
                <div id="vital-param-buttons" class="button-group"></div>
              </div>
            </div>
            <div class="controls-col">
              <div class="form-group compact">
                <label class="form-label">RBC Component Factors:</label>
                <div id="component-factor-buttons" class="button-group"></div>
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
                  <button id="time-reset" class="btn btn-sm">Reset</button>
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
      
      <div id="debug-container" style="display: none;">
        <div class="form-group compact">
          <label>
            <input type="checkbox" id="debug-mode"> Enable Debug Mode
          </label>
        </div>
        <div id="debug-output" class="debug-info" style="display: none;"></div>
      </div>
    </div>
    
    <div class="card">
      <div id="chart-title" class="header" style="margin-bottom: 8px;"></div>
      <div id="model-descriptions" class="info compact-model-descriptions" style="margin-bottom: 8px;"></div>
      <div id="charts-container" class="chart-grid">
        <!-- Dynamic charts will be inserted here -->
      </div>
    </div>
  `;
}

/**
 * Initialize the RBC Component Factors tab
 * This tab uses the existing visualization functionality
 * 
 * @param {string} containerId - ID of the container element
 * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
 * @param {Function} logDebug - Debug logging function
 */
function initializeRbcComponentFactors(containerId, fileCase, logDebug) {
  const container = document.getElementById(containerId);
  if (!container) {
    logDebug('Cannot initialize RBC Component Factors: container not found');
    return;
  }
  
  // State for this module
  const state = {
    selectedVital: null,
    selectedFactor: null,
    chart: null,
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
    ],
    componentFactorInfo: [
      { value: 'DonorHb_Cat', label: 'Donor Hemoglobin (g/L)', color: '#3b82f6' },
      { value: 'DonorParity', label: 'Donor Parity', color: '#ef4444' },
      { value: 'DonorSex', label: 'Donor Sex', color: '#10b981' },
      { value: 'Storage_Cat', label: 'RBC Storage Time (days)', color: '#f59e0b' },
      { value: 'wdy_donation', label: 'Weekday of Donation', color: '#8b5cf6' }
    ]
  };
  
  // Create button controls for vital parameters and component factors
  createButtonControls(state);
  
  // Add event listeners
  addEventListeners(state);
  
  // Listen for theme changes
  document.addEventListener('themeChanged', () => {
    logDebug('Theme changed in RBC Component Factors tab, updating chart...');
    updateChart(state);
  });
  
  logDebug('RBC Component Factors tab initialized');
}

/**
 * Create button controls for vital parameters and component factors
 * @param {Object} state - Module state
 */
function createButtonControls(state) {
  const vitalParamContainer = document.getElementById('vital-param-buttons');
  const componentFactorContainer = document.getElementById('component-factor-buttons');
  
  if (!vitalParamContainer || !componentFactorContainer) return;
  
  // Clear existing buttons
  vitalParamContainer.innerHTML = '';
  componentFactorContainer.innerHTML = '';
  
  // Create buttons for vital parameters
  state.vitalParamInfo.forEach(param => {
    const button = document.createElement('button');
    button.className = 'vital-param-button';
    button.dataset.value = param.value;
    button.innerHTML = `<span class="button-label">${param.label}</span>`;
    
    button.addEventListener('click', () => handleVitalParamClick(state, param.value));
    vitalParamContainer.appendChild(button);
  });
  
  // Create buttons for component factors
  state.componentFactorInfo.forEach(factor => {
    const button = document.createElement('button');
    button.className = 'component-factor-button';
    button.dataset.value = factor.value;
    button.innerHTML = `<span class="button-label">${factor.label}</span>`;
    
    button.addEventListener('click', () => handleComponentFactorClick(state, factor.value));
    componentFactorContainer.appendChild(button);
  });
}

/**
 * Handle click event for vital parameter buttons
 * @param {Object} state - Module state
 * @param {string} vitalParam - Vital parameter code
 */
function handleVitalParamClick(state, vitalParam) {
  state.selectedVital = vitalParam;
  updateButtonStates(state);
  updateChart(state);
}

/**
 * Handle click event for component factor buttons
 * @param {Object} state - Module state
 * @param {string} componentFactor - Component factor code
 */
function handleComponentFactorClick(state, componentFactor) {
  state.selectedFactor = componentFactor;
  updateButtonStates(state);
  updateChart(state);
}

/**
 * Update button states to reflect current selections
 * @param {Object} state - Module state
 */
function updateButtonStates(state) {
  state.vitalParamInfo.forEach(param => {
    const button = document.querySelector(`.vital-param-button[data-value="${param.value}"]`);
    if (button) {
      button.classList.toggle('active', state.selectedVital === param.value);
    }
  });
  
  state.componentFactorInfo.forEach(factor => {
    const button = document.querySelector(`.component-factor-button[data-value="${factor.value}"]`);
    if (button) {
      button.classList.toggle('active', state.selectedFactor === factor.value);
    }
  });
}

/**
 * Add event listeners for the controls
 * @param {Object} state - Module state
 */
function addEventListeners(state) {
  // Time range controls
  document.getElementById('time-min').addEventListener('change', (e) => {
    state.timeRange[0] = parseInt(e.target.value);
    updateChart(state);
  });
  
  document.getElementById('time-max').addEventListener('change', (e) => {
    state.timeRange[1] = parseInt(e.target.value);
    updateChart(state);
  });
  
  document.getElementById('time-reset').addEventListener('click', () => {
    state.timeRange = [0, 720];
    document.getElementById('time-min').value = 0;
    document.getElementById('time-max').value = 720;
    updateChart(state);
  });
  
  // Display options
  document.getElementById('show-ci').addEventListener('change', (e) => {
    state.showConfidenceInterval = e.target.checked;
    updateChart(state);
  });
  
  document.getElementById('show-base').addEventListener('change', (e) => {
    state.showBaseModel = e.target.checked;
    updateChart(state);
  });
  
  document.getElementById('show-delta').addEventListener('change', (e) => {
    state.showDeltaPlot = e.target.checked;
    updateChart(state);
  });
}

/**
 * Update the chart with current settings
 * @param {Object} state - Module state
 */
function updateChart(state) {
  if (!state.selectedVital || !state.selectedFactor) {
    return;
  }
  
  showLoading(state);
  
  loadVisualizationData(state.selectedVital, state.selectedFactor, state.fileCase, state.logDebug)
    .then(data => {
      const chartData = prepareChartData(data, [state.selectedFactor], state.timeRange, state.showDeltaPlot, state.showConfidenceInterval, state.showBaseModel, state.selectedFactor, [state.selectedFactor]);
      if (chartData) {
        // Destroy existing charts if any
        if (state.charts[state.selectedVital]) {
          state.charts[state.selectedVital].forEach(chart => chart.destroy());
        }
        
        // Create new charts
        state.charts[state.selectedVital] = [];
        const chartContainer = document.getElementById('charts-container');
        chartContainer.innerHTML = ''; // Clear existing charts
        
        // Create a grid layout
        const grid = document.createElement('div');
        grid.className = 'chart-grid';
        chartContainer.appendChild(grid);
        
        // Create charts for each combination
        const combinations = [state.selectedFactor];
        combinations.forEach((factor, index) => {
          const chartElement = document.createElement('div');
          chartElement.className = 'chart-container';
          grid.appendChild(chartElement);
          
          const chart = renderChart(chartData, data.metaInfo, state.timeRange, state.showDeltaPlot, state.selectedVital, null, factor);
          state.charts[state.selectedVital].push(chart);
          
          // Add chart title
          const chartTitle = document.createElement('div');
          chartTitle.className = 'chart-title';
          chartTitle.textContent = `${getVitalParamLabel(state, state.selectedVital)} vs ${getComponentFactorLabel(state, factor)}`;
          chartElement.insertBefore(chartTitle, chartElement.firstChild);
        });
      }
    })
    .catch(error => {
      state.logDebug(`Failed to update chart: ${error.message}`);
      const container = document.getElementById('charts-container');
      showError(`Failed to load data for ${getVitalParamLabel(state, state.selectedVital)} and ${getComponentFactorLabel(state, state.selectedFactor)}: ${error.message}`, container);
    })
    .finally(() => {
      hideLoading(state);
    });
}

/**
 * Get the human-readable label for a component factor
 * @param {Object} state - Module state
 * @param {string} componentFactor - Component factor code
 * @returns {string} Human-readable label
 */
function getComponentFactorLabel(state, componentFactor) {
  const factorInfo = state.componentFactorInfo.find(factor => factor.value === componentFactor);
  return factorInfo ? factorInfo.label : componentFactor;
}
