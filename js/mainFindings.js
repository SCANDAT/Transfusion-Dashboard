/**
 * Main Findings functionality for the Transfusion Dashboard
 * Implements the vital parameters summary table from observed and model-based data
 */

/**
 * Load the observed data summary from CSV
 * @param {string} fileCase - The file case sensitivity pattern (uppercase/lowercase)
 * @param {function} logDebug - Debug logging function
 * @returns {Promise<Array>} - The loaded and parsed data
 */
async function loadObservedDataSummary(fileCase, logDebug = console.log) {
  try {
    logDebug(`Loading observed data summary`);
    const result = await safeFetch('observed_data_summary', fileCase, logDebug);
    
    return new Promise((resolve, reject) => {
      Papa.parse(result.text, {
        header: true,
        skipEmptyLines: true,
        complete: results => {
          if (results.errors && results.errors.length > 0) {
            logDebug(`CSV parse errors: ${JSON.stringify(results.errors)}`);
          }
          resolve(results.data);
        },
        error: error => reject(error)
      });
    });
  } catch (error) {
    logDebug(`Error loading observed data summary: ${error.message}`);
    throw error;
  }
}

/**
 * Load the model-based summary data from CSV
 * @param {string} fileCase - The file case sensitivity pattern (uppercase/lowercase)
 * @param {function} logDebug - Debug logging function
 * @returns {Promise<Array>} - The loaded and parsed data
 */
async function loadModelBasedSummary(fileCase, logDebug = console.log) {
  try {
    logDebug(`Loading model-based summary`);
    const result = await safeFetch('model_based_summary', fileCase, logDebug);
    
    return new Promise((resolve, reject) => {
      Papa.parse(result.text, {
        header: true,
        skipEmptyLines: true,
        complete: results => {
          if (results.errors && results.errors.length > 0) {
            logDebug(`CSV parse errors: ${JSON.stringify(results.errors)}`);
          }
          resolve(results.data);
        },
        error: error => reject(error)
      });
    });
  } catch (error) {
    logDebug(`Error loading model-based summary: ${error.message}`);
    throw error;
  }
}

/**
 * Format a mean and standard deviation pair
 * @param {number} mean - The mean value
 * @param {number} sd - The standard deviation
 * @returns {string} - Formatted as "mean (sd)" with appropriate rounding
 */
function formatMeanSd(mean, sd) {
  // Round to whole numbers as shown in the table
  const roundedMean = Math.round(parseFloat(mean));
  const roundedSd = Math.round(parseFloat(sd));
  return `${roundedMean} (${roundedSd})`;
}

/**
 * Format a mean difference with confidence interval
 * @param {number} mean - The mean difference
 * @param {number} lcl - The lower confidence limit
 * @param {number} ucl - The upper confidence limit
 * @returns {string} - Formatted as "mean (lcl to ucl)" with appropriate rounding
 */
function formatDiffCi(mean, lcl, ucl) {
  // Round to 2 decimal places as shown in the table
  const roundedMean = parseFloat(mean).toFixed(2);
  const roundedLcl = parseFloat(lcl).toFixed(2);
  const roundedUcl = parseFloat(ucl).toFixed(2);
  return `${roundedMean} (${roundedLcl} to ${roundedUcl})`;
}

/**
 * Get the human-readable parameter name and unit from abbreviation
 * @param {string} abbr - The parameter abbreviation
 * @returns {Object} - Object with name and unit properties
 */
function getParameterDetails(abbr) {
  const mapping = {
    'ARTm': { 
      name: 'Mean Arterial Pressure', 
      unit: 'mmHg' 
    },
    'ARTs': { 
      name: 'Systolic Blood Pressure', 
      unit: 'mmHg' 
    },
    'ARTd': { 
      name: 'Diastolic Blood Pressure', 
      unit: 'mmHg' 
    },
    'Hjärtfrekv': { 
      name: 'Heart Rate', 
      unit: 'bpm' 
    },
    'FIO2(u)': { 
      name: 'Fraction of Inspired Oxygen', 
      unit: '%' 
    },
    'SpO2': { 
      name: 'Peripheral Capillary Oxygen Saturation', 
      unit: '%' 
    },
    'VE(u)': { 
      name: 'Minute Ventilation', 
      unit: 'L/min' 
    }
  };
  
  return mapping[abbr] || { name: abbr, unit: '' };
}

/**
 * Initialize the Main Findings tab
 * @param {string} tabId - The ID of the tab element
 * @param {string} fileCase - The file case sensitivity pattern (uppercase/lowercase)
 * @param {function} logDebug - Debug logging function
 */
async function initializeMainFindings(tabId, fileCase, logDebug = console.log) {
  try {
    logDebug('Initializing Main Findings tab');
    const tabElement = document.getElementById(tabId);
    
    if (!tabElement) {
      logDebug(`Tab element ${tabId} not found`);
      return;
    }
    
    // Show loading state
    tabElement.innerHTML = '<div class="loading">Loading main findings data...</div>';
    
    // Load the data
    const observedData = await loadObservedDataSummary(fileCase, logDebug);
    const modelData = await loadModelBasedSummary(fileCase, logDebug);
    
    logDebug(`Loaded observed data (${observedData.length} rows) and model data (${modelData.length} rows)`);
    
    // Create the table
    tabElement.innerHTML = createMainFindingsContent(observedData, modelData);
    
    logDebug('Main Findings tab initialized successfully');
  } catch (error) {
    logDebug(`Error initializing Main Findings tab: ${error.message}`);
    
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
      tabElement.innerHTML = `
        <div class="card error-card">
          <h2>Error Loading Main Findings</h2>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
}

/**
 * Create the main findings content with the vital parameters table
 * @param {Array} observedData - The observed data summary
 * @param {Array} modelData - The model-based summary data
 * @returns {string} - HTML content for the tab
 */
function createMainFindingsContent(observedData, modelData) {
  // Ensure the data is properly ordered for display
  const parameterOrder = [
    'ARTm', 'ARTs', 'ARTd', 'Hjärtfrekv', 'FIO2(u)', 'SpO2', 'VE(u)'
  ];
  
  // Create cards for the findings
  return `
    <div class="findings-container">
      <div class="card">
        <h2>Table 2. Transfusion Related Changes in Vital Parameters</h2>
        <div class="table-container">
          <table class="findings-table">
            <colgroup>
              <col class="col-parameter">
              <col class="col-unit">
            </colgroup>
            <colgroup>
              <col class="col-pre">
              <col class="col-post">
              <col class="col-change">
            </colgroup>
            <colgroup>
              <col class="col-base">
              <col class="col-adjusted">
            </colgroup>
            
            <thead>
              <tr>
                <th colspan="2"></th>
                <th colspan="3">Population Estimates</th>
                <th colspan="2">Model Estimates</th>
              </tr>
              <tr>
                <th>Vital Parameter</th>
                <th>Unit of Measurement</th>
                <th>T-1 hour</th>
                <th>T+1 hour</th>
                <th>Vital Parameter Change</th>
                <th>Base Model<sup>1</sup></th>
                <th>Fully Adjusted Model<sup>2</sup></th>
              </tr>
              <tr class="subheader">
                <th colspan="2"></th>
                <th>Mean (S.D)</th>
                <th>Mean (S.D)</th>
                <th>Mean difference (95% C.I.)</th>
                <th>Mean difference (95% C.I.)</th>
                <th>Mean difference (95% C.I.)</th>
              </tr>
            </thead>
            <tbody>
              ${parameterOrder.map(abbr => {
                const observed = observedData.find(row => row.Abbreviation === abbr);
                const model = modelData.find(row => row.Abbreviation === abbr);
                
                if (!observed || !model) return '';
                
                const paramDetails = getParameterDetails(abbr);
                
                return `
                  <tr>
                    <td>${paramDetails.name}</td>
                    <td>${paramDetails.unit}</td>
                    <td>${formatMeanSd(observed.Pre_Mean, observed.Pre_SD)}</td>
                    <td>${formatMeanSd(observed.Post_Mean, observed.Post_SD)}</td>
                    <td>${formatDiffCi(observed.Diff_Mean, observed.Diff_LCL, observed.Diff_UCL)}</td>
                    <td>${formatDiffCi(model.Base_Diff, model.Base_Diff_LCL, model.Base_Diff_UCL)}</td>
                    <td>${formatDiffCi(model.Full_Diff, model.Full_Diff_LCL, model.Full_Diff_UCL)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="table-footnotes">
          <p><sup>1</sup>Base Model: A mixed-effects model with a random intercept for patient ID that adjusts for time from transfusion (natural cubic spline with fixed knots at -660, -360, -60, 0, 60, 360, and 660 minutes), patient age and time spent in the ICU prior to transfusion (natural cubic splines with three percentile-based knots), RBC transfusion count, patient sex, and ICU ward name.</p>
          <p><sup>2</sup>Fully Adjusted Model: A mixed-effects model containing all base model variables as well as cumulative crystalloid fluids and vasopressors administered (in ml) in the last 1 and 24 hours prior to transfusion (natural cubic splines with three percentile-based knots), and a binary variable for whether sedatives were administered in the last 1 and 24 hours prior to transfusion.</p>
        </div>
      </div>
    </div>
  `;
}
