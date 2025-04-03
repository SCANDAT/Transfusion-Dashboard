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
  
  const vitalParamAbbr = {
    "ARTm": "MAP",
    "ARTs": "SBP",
    "ARTd": "DBP",
    "Hjärtfrekv": "HR",
    "FIO2(u)": "FiO₂",
    "SpO2": "SpO₂",
    "VE(u)": "VE"
  };

  return {
    name: vitalParamNames[param] || param,
    unit: vitalParamUnits[param] || "",
    abbr: vitalParamAbbr[param] || param
  };
}

/**
 * Format the p-value with significance indicators
 * @param {number} pValue - The p-value
 * @returns {string} - Formatted p-value with significance indicators
 */
function formatPValue(pValue) {
  if (pValue === undefined || isNaN(pValue)) return '';
  
  let indicator = '';
  if (pValue < 0.001) indicator = '***';
  else if (pValue < 0.01) indicator = '**';
  else if (pValue < 0.05) indicator = '*';
  
  return indicator ? `(p=${pValue.toFixed(3)})${indicator}` : `(p=${pValue.toFixed(3)})`;
}

/**
 * Calculate the min and max values for the scale across all estimates for a vital parameter
 * Autoscale the range with a 25% margin on each side
 * @param {Object} paramData - Data for a specific vital parameter
 * @returns {Object} - Min and max values
 */
function calculateScaleRange(paramData) {
  let min = Infinity;
  let max = -Infinity;
  let hasData = false;
  
  // Calculate min/max from all data points
  Object.keys(paramData).forEach(factor => {
    Object.keys(paramData[factor]).forEach(category => {
      const data = paramData[factor][category];
      
      // Check all three estimate types
      ['observed', 'base', 'full'].forEach(type => {
        if (data[type] && !isNaN(data[type].diff)) {
          hasData = true;
          if (!isNaN(data[type].lcl)) min = Math.min(min, data[type].lcl);
          if (!isNaN(data[type].ucl)) max = Math.max(max, data[type].ucl);
        }
      });
    });
  });
  
  // Handle edge cases
  if (!hasData || min === Infinity || max === -Infinity) {
    min = -1;
    max = 1;
  }
  
  // Always include zero in the range
  if (min > 0) min = 0; // Force include zero for all positive data
  if (max < 0) max = 0; // Force include zero for all negative data
  
  // Add 25% margin on each side and round to nice values
  const range = max - min;
  const margin = range * 0.25; // 25% margin as requested
  min = Math.floor(min - margin);
  max = Math.ceil(max + margin);
  
  return { min, max };
}

/**
 * Generate evenly spaced tick values for the x-axis
 * @param {number} min - Minimum scale value
 * @param {number} max - Maximum scale value
 * @returns {Array} - Array of tick values
 */
function generateTicks(min, max) {
  const ticks = [];
  const desiredTickCount = 5; // Aim for around 5 ticks
  
  // Always include min, max, and zero (if in range)
  ticks.push(min);
  if (min < 0 && max > 0) ticks.push(0);
  ticks.push(max);
  
  // Calculate a reasonable step size
  const range = max - min;
  let step;
  
  if (range <= 5) step = 1;
  else if (range <= 10) step = 2;
  else if (range <= 20) step = 5;
  else step = Math.ceil(range / desiredTickCount);
  
  // Add intermediate ticks
  for (let value = Math.ceil(min / step) * step; value < max; value += step) {
    if (value !== min && value !== 0 && value !== max) {
      ticks.push(value);
    }
  }
  
  return ticks.sort((a, b) => a - b);
}

/**
 * Converts a data value to its position on the plot
 * @param {number} value - Data value to position
 * @param {number} min - Minimum scale value
 * @param {number} max - Maximum scale value
 * @param {number} width - Plot width in pixels
 * @returns {number} - Position in pixels
 */
function valueToPosition(value, min, max, width) {
  // Prevent division by zero
  if (max === min) return width / 2;
  
  // Calculate position proportionally
  // Ensure we're using the exact formula without any rounding that could cause alignment issues
  const position = width * ((value - min) / (max - min));
  
  // Ensure the position is within bounds but don't round here
  // Rounding will occur at the final positioning stage
  return Math.max(0, Math.min(width, position));
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
      <div class="change-heading">Change</div>
      <div class="factor-grid">
        ${factorOrder.map(factor => {
          if (!factor) return `<div class="factor-cell empty"></div>`;
          
          const factorData = paramData[factor];
          if (!factorData) return `<div class="factor-cell empty"></div>`;
          
          return `
            <div class="factor-cell">
              <h4>${getFactorName(factor)}</h4>
              ${renderFactorVisualization(factor, factorData, scaleRange, paramDetails)}
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
 * @param {Object} paramDetails - Parameter details with name, unit, and abbreviation
 * @returns {string} - HTML content for the factor visualization
 */
function renderFactorVisualization(factor, factorData, scaleRange, paramDetails) {
  const { min, max } = scaleRange;
  const width = 230; // Plot width in pixels
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
  
  // Create a consistent value-to-position mapping function for this factor
  const vToPos = (value) => valueToPosition(value, min, max, width);
  
  // Create a consistent x-axis with evenly spaced ticks that align with data values
  const tickCount = 5; // Use 5 ticks including min, max, and 0 (if in range)
  let tickValues = [];
  
  // Always include min and max
  tickValues.push(min);
  tickValues.push(max);
  
  // Always include zero if it's in range
  if (min < 0 && max > 0) {
    tickValues.push(0);
  }
  
  // Add additional ticks to reach our desired count
  if (tickValues.length < tickCount) {
    // Calculate range and step size
    const range = max - min;
    const idealStep = range / (tickCount - 1);
    
    // Create reasonable step size (e.g., 1, 2, 5, 10, etc.)
    let stepSize;
    const magnitude = Math.pow(10, Math.floor(Math.log10(idealStep)));
    if (idealStep / magnitude < 1.5) {
      stepSize = magnitude;
    } else if (idealStep / magnitude < 3.5) {
      stepSize = 2 * magnitude;
    } else if (idealStep / magnitude < 7.5) {
      stepSize = 5 * magnitude;
    } else {
      stepSize = 10 * magnitude;
    }
    
    // Add ticks at regular intervals
    for (let value = Math.ceil(min / stepSize) * stepSize; value <= max; value += stepSize) {
      if (value !== min && value !== max && (min < 0 && max > 0 ? value !== 0 : true)) {
        tickValues.push(value);
      }
    }
  }
  
  // Sort and limit to desired tick count
  tickValues.sort((a, b) => a - b);
  if (tickValues.length > tickCount) {
    // Keep min, max, and zero (if present), and evenly distribute the rest
    const keepIndices = new Set([0, tickValues.length - 1]); // Min and max
    if (min < 0 && max > 0) {
      // Find index of zero
      const zeroIndex = tickValues.findIndex(v => v === 0);
      if (zeroIndex !== -1) {
        keepIndices.add(zeroIndex);
      }
    }
    
    // Add additional indices as needed
    while (keepIndices.size < Math.min(tickCount, tickValues.length)) {
      // Find largest gap and add a tick in the middle
      let maxGapStart = -1;
      let maxGapSize = -1;
      
      for (let i = 0; i < tickValues.length - 1; i++) {
        if (!keepIndices.has(i) || !keepIndices.has(i + 1)) {
          // Find next kept index
          let nextKept = i + 1;
          while (nextKept < tickValues.length && !keepIndices.has(nextKept)) {
            nextKept++;
          }
          
          if (nextKept < tickValues.length) {
            const gap = tickValues[nextKept] - tickValues[i];
            if (gap > maxGapSize) {
              maxGapSize = gap;
              maxGapStart = i;
            }
          }
        }
      }
      
      if (maxGapStart !== -1) {
        // Find index in the middle of the gap
        let nextKept = maxGapStart + 1;
        while (nextKept < tickValues.length && !keepIndices.has(nextKept)) {
          nextKept++;
        }
        
        if (nextKept < tickValues.length) {
          const middleIndex = Math.floor((maxGapStart + nextKept) / 2);
          keepIndices.add(middleIndex);
        }
      } else {
        break; // No more gaps to fill
      }
    }
    
    // Filter to kept indices
    tickValues = tickValues.filter((_, i) => keepIndices.has(i));
  }
  
  // Generate tick positions and labels that align perfectly with the data values
  // Important: Do not add any offsets to these positions to ensure alignment with data points
  const tickPositions = tickValues.map(value => vToPos(value));
  const tickLabels = tickValues.map(value => {
    // Format tick labels, with special handling for zero
    if (value === 0) return "0"; // No decimal places for zero
    return value.toFixed(1);
  });
  
  // Get zero position for reference line
  const zeroPos = min < 0 && max > 0 ? vToPos(0) : -9999; // Hide if zero not in range
  
  return `
    <div class="factor-visualization">
      <div class="factor-plot" style="width: ${width}px;">
        <div class="zero-line" style="left: ${zeroPos}px;"></div>
        
        ${sortedCategories.map(category => {
          const data = factorData[category];
          const label = getCategoryLabel(factor, category);
          
          return `
            <div class="category-container">
              <div class="category-label">${label}</div>
              
              <div class="estimates-container">
                ${renderEstimate('observed', data.observed, vToPos)}
                ${renderEstimate('base-model', data.base, vToPos)}
                ${renderEstimate('adjusted-model', data.full, vToPos)}
              </div>
            </div>
          `;
        }).join('')}
        
        <div class="x-axis">
          <div class="axis-line"></div>
          ${tickPositions.map((position, i) => {
            // Check if this is the zero tick to add a special class
            const isZeroTick = tickValues[i] === 0;
            const zeroClass = isZeroTick ? 'zero-tick' : '';
            
            return `
              <div class="axis-tick ${zeroClass}" style="left: ${position}px;">
                <div class="axis-tick-line"></div>
                <div class="axis-tick-label">${tickLabels[i]}</div>
              </div>
            `;
          }).join('')}
          <div class="x-axis-title">${paramDetails.abbr} (${paramDetails.unit})</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a single estimate with confidence interval
 * @param {string} className - CSS class name for the estimate type
 * @param {Object} data - Estimate data (diff, lcl, ucl, pValue)
 * @param {Function} valueToPosition - Function to convert value to position
 * @returns {string} - HTML content for the estimate
 */
function renderEstimate(className, data, valueToPosition) {
  if (!data || isNaN(data.diff)) return '';
  
  // Calculate the exact positions for the data points - don't round yet
  const diffPos = valueToPosition(data.diff);
  const lclPos = valueToPosition(data.lcl);
  const uclPos = valueToPosition(data.ucl);
  
  // Handle possible reverse ordering if lcl > ucl due to calculation issues
  const left = Math.min(lclPos, uclPos);
  const right = Math.max(lclPos, uclPos);
  const width = right - left;
  
  // Format value with p-value for observed data, or confidence interval for models
  let valueText = isNaN(data.diff) ? "N/A" : data.diff.toFixed(2);
  
  if (className === 'observed' && data.pValue !== undefined && !isNaN(data.pValue)) {
    // For observed data, add p-value
    const pValue = data.pValue;
    let pValueText = `(p=${pValue.toFixed(3)})`;
    
    // Add significance indicators
    if (pValue < 0.001) pValueText += '***';
    else if (pValue < 0.01) pValueText += '**';
    else if (pValue < 0.05) pValueText += '*';
    
    valueText += ` <span class="p-value">${pValueText}</span>`;
  } else if (className !== 'observed' && !isNaN(data.lcl) && !isNaN(data.ucl)) {
    // For model data, add confidence interval
    valueText += ` <span class="ci-value">(${data.lcl.toFixed(2)} to ${data.ucl.toFixed(2)})</span>`;
  }
  
  // Add debug info as data attributes
  return `
    <div class="estimate-container ${className}" 
         data-diff="${data.diff}" 
         data-lcl="${data.lcl}" 
         data-ucl="${data.ucl}">
      <div class="estimate-line" style="left: ${left}px; width: ${width}px;">
        <div class="estimate-point" style="left: ${Math.round(diffPos - left)}px;"></div>
      </div>
      <div class="estimate-value">
        ${valueText}
      </div>
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
        <p><sup>1</sup><span style="font-weight: bold;">Base Model:</span> Adjusted for patient age, sex, hour of day, primary diagnosis category, and SOFA score.</p>
        <p><sup>2</sup><span style="font-weight: bold;">Fully Adjusted Model:</span> Additionally adjusted for all other component factors shown in this table.</p>
        <p><span style="font-weight: bold;">Vertical Arrangement:</span> For each category, the estimates are arranged vertically with observed population data (top/blue), base model (middle/orange), and fully adjusted model (bottom/green).</p>
        <p><span style="font-weight: bold;">Change Values:</span> All values represent the estimated change in the vital parameter with 95% confidence intervals. P-values are shown for observed population estimates.</p>
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
