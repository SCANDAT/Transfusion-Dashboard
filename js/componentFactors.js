/**
 * Component Factor Effects visualization for the Transfusion Dashboard
 * Implements a small multiples visualization of RBC component factor effects on vital parameters
 */

/**
 * Load the factor observed data summary from CSV
 * @param {string} fileCase - The file case sensitivity pattern (uppercase/lowercase)
 * @param {function} logDebug - Debug logging function
 * @returns {Promise<Array>} - The loaded and parsed data
 */
async function loadFactorObservedDataSummary(fileCase, logDebug = console.log) {
  try {
    logDebug(`Loading factor observed data summary`);
    const result = await safeFetch('factor_observed_data_summary', fileCase, logDebug);
    
    return new Promise((resolve, reject) => {
      Papa.parse(result.text, {
        header: true,
        skipEmptyLines: true,
        complete: results => {
          if (results.errors && results.errors.length > 0) {
            logDebug(`CSV parse errors: ${JSON.stringify(results.errors)}`);
          }
          // Filter out summary rows (where FactorCategory is "." or null)
          const filteredData = results.data.filter(row => row.FactorCategory !== "." && row.FactorCategory !== null);
          resolve(filteredData);
        },
        error: error => reject(error)
      });
    });
  } catch (error) {
    logDebug(`Error loading factor observed data summary: ${error.message}`);
    throw error;
  }
}

/**
 * Load the factor model-based summary data from CSV
 * @param {string} fileCase - The file case sensitivity pattern (uppercase/lowercase)
 * @param {function} logDebug - Debug logging function
 * @returns {Promise<Array>} - The loaded and parsed data
 */
async function loadFactorModelBasedSummary(fileCase, logDebug = console.log) {
  try {
    logDebug(`Loading factor model-based summary`);
    const result = await safeFetch('factor_model_based_summary', fileCase, logDebug);
    
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
    logDebug(`Error loading factor model-based summary: ${error.message}`);
    throw error;
  }
}

/**
 * Process component factor data and organize it for visualization
 * @param {Array} observedData - The observed data summary
 * @param {Array} modelData - The model-based data summary
 * @returns {Object} - Data organized by vital parameter, factor, and category
 */
function processComponentFactorData(observedData, modelData) {
  // Define vital parameters in the specific order
  const vitalParameters = [
    'ARTm', 'ARTs', 'ARTd', 'Hjärtfrekv', 'FIO2(u)', 'SpO2', 'VE(u)'
  ];
  
  // Define component factors in the specific grid layout order
  const componentFactors = [
    'DonorHb_Cat', 'Storage_Cat', 'wdy_donation', 
    'DonorSex', 'DonorParity'
  ];
  
  // Initialize the data structure
  const structured = {};
  
  // Initialize each vital parameter
  vitalParameters.forEach(param => {
    structured[param] = {};
    
    // Initialize each component factor
    componentFactors.forEach(factor => {
      structured[param][factor] = {};
    });
  });
  
  // Process observed data
  observedData.forEach(row => {
    if (!vitalParameters.includes(row.Abbreviation)) return;
    if (!componentFactors.includes(row.FactorName)) return;
    
    const param = row.Abbreviation;
    const factor = row.FactorName;
    const category = row.FactorCategory;
    
    if (!structured[param][factor][category]) {
      structured[param][factor][category] = {
        observed: {
          diff: parseFloat(row.Diff_Mean),
          lcl: parseFloat(row.Diff_LCL),
          ucl: parseFloat(row.Diff_UCL),
          pValue: parseFloat(row.p_value)
        }
      };
    } else {
      structured[param][factor][category].observed = {
        diff: parseFloat(row.Diff_Mean),
        lcl: parseFloat(row.Diff_LCL),
        ucl: parseFloat(row.Diff_UCL),
        pValue: parseFloat(row.p_value)
      };
    }
  });
  
  // Process model data
  modelData.forEach(row => {
    if (!vitalParameters.includes(row.Abbreviation)) return;
    if (!componentFactors.includes(row.FactorName)) return;
    
    const param = row.Abbreviation;
    const factor = row.FactorName;
    const category = row.FactorCategory;
    
    if (!structured[param][factor][category]) {
      structured[param][factor][category] = {};
    }
    
    structured[param][factor][category].base = {
      diff: parseFloat(row.Base_Diff),
      lcl: parseFloat(row.Base_Diff_LCL),
      ucl: parseFloat(row.Base_Diff_UCL)
    };
    
    structured[param][factor][category].full = {
      diff: parseFloat(row.Full_Diff),
      lcl: parseFloat(row.Full_Diff_LCL),
      ucl: parseFloat(row.Full_Diff_UCL)
    };
  });
  
  return structured;
}

/**
 * Get the human-readable category label
 * @param {string} factor - The factor name
 * @param {string} category - The category code
 * @returns {string} - The human-readable label
 */
function getCategoryLabel(factor, category) {
  const factorCategoryLabels = {
    "DonorHb_Cat": {
      "1": "<125 g/L",
      "2": "125-139 g/L",
      "3": "140-154 g/L",
      "4": "155-169 g/L", 
      "5": "≥170 g/L"
    },
    "Storage_Cat": {
      "1": "<10 days",
      "2": "10-19 days",
      "3": "20-29 days",
      "4": "30-39 days",
      "5": "≥40 days"
    },
    "DonorSex": {
      "1": "Male",
      "2": "Female"
    },
    "DonorParity": {
      "0": "Nulliparous",
      "1": "Parous"
    },
    "wdy_donation": {
      "1": "Sunday",
      "2": "Monday",
      "3": "Tuesday",
      "4": "Wednesday",
      "5": "Thursday",
      "6": "Friday",
      "7": "Saturday"
    }
  };

  return factorCategoryLabels[factor]?.[category] || category;
}

/**
 * Get the human-readable factor name
 * @param {string} factor - The factor name
 * @returns {string} - The human-readable name
 */
function getFactorName(factor) {
  const factorNames = {
    "DonorHb_Cat": "Donor Hemoglobin",
    "Storage_Cat": "Storage Time",
    "DonorSex": "Donor Sex",
    "DonorParity": "Donor Parity",
    "wdy_donation": "Weekday of Donation"
  };

  return factorNames[factor] || factor;
}

/**
 * Get parameter details (name and unit) for a vital parameter
 * @param {string} param - The vital parameter abbreviation
 * @returns {Object} - Parameter details with name and unit
 */
function getParameterDetails(param) {
  const vitalParamNames = {
    "ARTm": "Mean Arterial Pressure",
    "ARTs": "Systolic Blood Pressure",
    "ARTd": "Diastolic Blood Pressure",
    "Hjärtfrekv": "Heart Rate",
    "FIO2(u)": "Fraction of Inspired Oxygen",
    "SpO2": "Peripheral Capillary Oxygen Saturation",
    "VE(u)": "Minute Ventilation"
  };

  const vitalParamUnits = {
    "ARTm": "mmHg",
    "ARTs": "mmHg",
    "ARTd": "mmHg",
    "Hjärtfrekv": "bpm",
    "FIO2(u)": "%",
    "SpO2": "%",
    "VE(u)": "L/min"
  };

  return {
    name: vitalParamNames[param] || param,
    unit: vitalParamUnits[param] || ""
  };
}

/**
 * Determine significance indicators based on p-value
 * @param {number} pValue - The p-value
 * @returns {string} - Significance indicator (* < 0.05, ** < 0.01, *** < 0.001)
 */
function getSignificanceIndicator(pValue) {
  if (pValue < 0.001) return '***';
  if (pValue < 0.01) return '**';
  if (pValue < 0.05) return '*';
  return '';
}

/**
 * Calculate the min and max values for the scale across all estimates for a vital parameter
 * @param {Object} paramData - Data for a specific vital parameter
 * @returns {Object} - Min and max values
 */
function calculateScaleRange(paramData) {
  let min = 0;
  let max = 0;
  
  Object.keys(paramData).forEach(factor => {
    Object.keys(paramData[factor]).forEach(category => {
      const data = paramData[factor][category];
      
      // Check observed data
      if (data.observed) {
        min = Math.min(min, data.observed.lcl);
        max = Math.max(max, data.observed.ucl);
      }
      
      // Check base model data
      if (data.base) {
        min = Math.min(min, data.base.lcl);
        max = Math.max(max, data.base.ucl);
      }
      
      // Check full model data
      if (data.full) {
        min = Math.min(min, data.full.lcl);
        max = Math.max(max, data.full.ucl);
      }
    });
  });
  
  // Add a margin to the min and max values
  const margin = (max - min) * 0.1;
  min = Math.floor(min - margin);
  max = Math.ceil(max + margin);
  
  return { min, max };
}

/**
 * Create the small multiples visualization for a vital parameter
 * @param {string} param - The vital parameter abbreviation
 * @param {Object} paramData - Data for the vital parameter
 * @returns {string} - HTML content for the visualization
 */
function createVitalParameterSection(param, paramData) {
  const paramDetails = getParameterDetails(param);
  const scaleRange = calculateScaleRange(paramData);
  
  // Create the factors grid layout (2x3 grid, last slot empty)
  const factorOrder = [
    'DonorHb_Cat', 'Storage_Cat', 'wdy_donation', 
    'DonorSex', 'DonorParity', null // null for empty slot
  ];
  
  return `
    <div class="vital-parameter-section">
      <h3>${paramDetails.name} (${paramDetails.unit})</h3>
      <div class="factor-grid">
        ${factorOrder.map(factor => {
          if (!factor) return `<div class="factor-cell empty"></div>`;
          
          const factorData = paramData[factor];
          if (!factorData) return `<div class="factor-cell empty"></div>`;
          
          return `
            <div class="factor-cell">
              <h4>${getFactorName(factor)}</h4>
              ${renderFactorVisualization(factor, factorData, scaleRange)}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render the visualization for a specific component factor
 * @param {string} factor - The component factor name
 * @param {Object} factorData - Data for the factor
 * @param {Object} scaleRange - Min and max values for the scale
 * @returns {string} - HTML content for the factor visualization
 */
function renderFactorVisualization(factor, factorData, scaleRange) {
  const { min, max } = scaleRange;
  const width = 250; // Plot width in pixels
  const zeroPosition = width * (-min / (max - min)); // Position of zero line
  
  // Sort categories based on known order
  const getCategoryOrder = (factor, category) => {
    if (factor === 'wdy_donation') {
      return parseInt(category, 10);
    }
    if (factor === 'DonorHb_Cat' || factor === 'Storage_Cat') {
      return parseInt(category, 10);
    }
    if (factor === 'DonorSex') {
      return parseInt(category, 10);
    }
    if (factor === 'DonorParity') {
      return parseInt(category, 10);
    }
    return 0;
  };
  
  const sortedCategories = Object.keys(factorData).sort((a, b) => {
    return getCategoryOrder(factor, a) - getCategoryOrder(factor, b);
  });
  
  // Convert value to position in the plot
  const valueToPosition = (value) => {
    return width * (value - min) / (max - min);
  };
  
  return `
    <div class="factor-visualization">
      <div class="factor-plot" style="width: ${width}px;">
        <div class="zero-line" style="left: ${zeroPosition}px;"></div>
        
        ${sortedCategories.map(category => {
          const data = factorData[category];
          const label = getCategoryLabel(factor, category);
          let significance = '';
          
          if (data.observed && data.observed.pValue !== undefined) {
            significance = getSignificanceIndicator(data.observed.pValue);
          }
          
          return `
            <div class="category-container">
              <div class="category-label">${label} ${significance}</div>
              
              <div class="estimates-container">
                ${renderEstimate('observed', data.observed, valueToPosition)}
                ${renderEstimate('base-model', data.base, valueToPosition)}
                ${renderEstimate('adjusted-model', data.full, valueToPosition)}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render a single estimate with confidence interval
 * @param {string} className - CSS class name for the estimate type
 * @param {Object} data - Estimate data (diff, lcl, ucl)
 * @param {Function} valueToPosition - Function to convert value to position
 * @returns {string} - HTML content for the estimate
 */
function renderEstimate(className, data, valueToPosition) {
  if (!data) return '';
  
  const diffPos = valueToPosition(data.diff);
  const lclPos = valueToPosition(data.lcl);
  const uclPos = valueToPosition(data.ucl);
  const width = uclPos - lclPos;
  
  return `
    <div class="estimate-container ${className}">
      <div class="estimate-line" style="left: ${lclPos}px; width: ${width}px;">
        <div class="estimate-point" style="left: ${diffPos - lclPos}px;"></div>
      </div>
      <div class="estimate-value">${data.diff.toFixed(2)}</div>
    </div>
  `;
}

/**
 * Create the entire Table 2b content
 * @param {Array} observedData - The observed data summary
 * @param {Array} modelData - The model-based data summary
 * @returns {string} - HTML content for Table 2b
 */
function createComponentFactorsTable(observedData, modelData) {
  // Process and organize the data
  const processedData = processComponentFactorData(observedData, modelData);
  
  // Define vital parameters in the specific order
  const vitalParameters = [
    'ARTm', 'ARTs', 'ARTd', 'Hjärtfrekv', 'FIO2(u)', 'SpO2', 'VE(u)'
  ];
  
  return `
    <div class="card">
      <h2>Table 2b. RBC Component Factor Effects on Vital Parameters</h2>
      
      <div class="component-factors-visualization">
        ${vitalParameters.map(param => {
          return createVitalParameterSection(param, processedData[param]);
        }).join('')}
      </div>
      
      <div class="visualization-legend">
        <div class="legend-items">
          <div class="legend-item">
            <span class="legend-marker observed"></span>
            <span>Observed Population Estimates</span>
          </div>
          <div class="legend-item">
            <span class="legend-marker base-model"></span>
            <span>Base Model Estimates<sup>1</sup></span>
          </div>
          <div class="legend-item">
            <span class="legend-marker adjusted-model"></span>
            <span>Fully Adjusted Model Estimates<sup>2</sup></span>
          </div>
        </div>
        
        <div class="significance-legend">
          <span>Significance: </span>
          <span class="sig-item">* p<0.05</span>
          <span class="sig-item">** p<0.01</span>
          <span class="sig-item">*** p<0.001</span>
        </div>
      </div>
      
      <div class="table-footnotes">
        <p><sup>1</sup><span style="font-weight: bold;">Base Model:</span> Same as in Table 2a.</p>
        <p><sup>2</sup><span style="font-weight: bold;">Fully Adjusted Model:</span> Same as in Table 2a.</p>
        <p><span style="font-weight: bold;">Vertical Arrangement:</span> For each category, the top estimate represents observed population data, the middle represents the base model, and the bottom represents the fully adjusted model.</p>
      </div>
    </div>
  `;
}

/**
 * Initialize the RBC Component Factors tab
 * @param {string} tabId - The ID of the tab element
 * @param {string} fileCase - The file case sensitivity pattern (uppercase/lowercase)
 * @param {function} logDebug - Debug logging function
 */
async function initializeRbcComponentFactors(tabId, fileCase, logDebug = console.log) {
  try {
    logDebug('Initializing RBC Component Factors tab');
    
    // Load the factor data first
    const factorObservedData = await loadFactorObservedDataSummary(fileCase, logDebug);
    const factorModelData = await loadFactorModelBasedSummary(fileCase, logDebug);
    
    logDebug(`Loaded factor observed data (${factorObservedData.length} rows) and factor model data (${factorModelData.length} rows)`);
    
    // Use Main Findings tab to add our Table 2b
    const mainFindingsTab = document.getElementById('main-findings-tab');
    if (!mainFindingsTab) {
      logDebug(`Main findings tab element not found`);
      return;
    }
    
    // Check if Table 2a exists and Table 2b doesn't exist yet
    const allH2s = mainFindingsTab.querySelectorAll('h2');
    let table2aExists = false;
    let table2bExists = false;
    
    // Check all h2 elements for our tables
    allH2s.forEach(h2 => {
      if (h2.textContent.includes('Table 2a')) table2aExists = true;
      if (h2.textContent.includes('Table 2b')) table2bExists = true;
    });
    
    if (table2aExists && !table2bExists) {
      // Create the visualization table
      const visualizationElement = document.createElement('div');
      visualizationElement.innerHTML = createComponentFactorsTable(factorObservedData, factorModelData);
      
      // Add it to the findings container
      const findingsContainer = mainFindingsTab.querySelector('.findings-container');
      if (findingsContainer) {
        findingsContainer.appendChild(visualizationElement.firstElementChild);
        logDebug('Added Table 2b to Main Findings tab');
      } else {
        logDebug('Findings container not found in Main Findings tab');
      }
    }
    
    logDebug('RBC Component Factors tab initialized successfully');
  } catch (error) {
    logDebug(`Error initializing RBC Component Factors tab: ${error.message}`);
    throw error;
  }
}
