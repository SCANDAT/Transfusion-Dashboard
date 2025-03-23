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
      </div>
      
      <div class="form-group compact">
        <label class="form-label">Comparison Values:</label>
        <div id="comparison-tags" class="comparison-tags-container"></div>
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
      <div id="chart-container" class="chart-container chart-container-large">
        <canvas id="chart-canvas"></canvas>
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
  
  // This tab now uses the existing visualization functionality
  // (The functions from visualization.js already work correctly for this tab)
  
  // Setup toggle functionality for Available Parameters & Factors section
  setTimeout(() => {
    const availableOptionsToggle = container.querySelector('.available-options-toggle');
    const availableOptions = container.querySelector('.available-options');
    
    if (availableOptionsToggle && availableOptions) {
      availableOptionsToggle.addEventListener('click', () => {
        availableOptions.classList.toggle('expanded');
      });
      
      // Initially collapsed
      availableOptions.classList.remove('expanded');
    }
  }, 100);
  
  logDebug('RBC Component Factors tab initialized');
}
