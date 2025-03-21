/**
 * Utility functions for the Transfusion Dashboard
 */

// Tab navigation functionality
function openTab(evt, tabName) {
    // Hide all tab content
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
      tabContents[i].classList.remove("active");
    }
    
    // Remove active class from all tab buttons
    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
      tabButtons[i].classList.remove("active");
    }
    
    // Show the selected tab content and mark button as active
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
  }
  
  /**
   * Format a number with comma separators
   * @param {number} num - The number to format
   * @returns {string} Formatted number with commas
   */
  function formatNumber(num) {
    if (num === null || num === undefined) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  /**
   * Format a number as a percentage with 1 decimal place
   * @param {number} num - The number to format as percentage
   * @returns {string} Formatted percentage
   */
  function formatPercent(num) {
    if (num === null || num === undefined) return '';
    // Format to 1 decimal place
    return (Math.round(num * 10) / 10).toFixed(1) + '%';
  }
  
  /**
   * Safe CSV fetch that tries multiple file path variations
   * @param {string} baseName - The base name of the file to fetch
   * @param {string} fileCase - The case style ('uppercase', 'lowercase', or 'unknown')
   * @param {Function} logDebug - Debug logging function
   * @returns {Promise<Object>} Object containing the text content and path of the fetched file
   */
  async function safeFetch(baseName, fileCase, logDebug = console.log) {
    const fileOptions = [];
    
    if (fileCase === 'uppercase') {
      fileOptions.push(`./data/${baseName.toUpperCase()}.CSV`);
      fileOptions.push(`./data/${baseName.toUpperCase()}.csv`);
    } else {
      fileOptions.push(`./data/${baseName}.csv`);
      fileOptions.push(`./data/${baseName}.CSV`);
    }
    
    // Also always try both cases as fallback
    fileOptions.push(`./data/${baseName.toUpperCase()}.CSV`);
    fileOptions.push(`./data/${baseName}.csv`);
    
    logDebug(`Attempting to fetch file with base name: ${baseName}`);
    logDebug(`Will try paths: ${fileOptions.join(', ')}`);
    
    let lastError = null;
    for (const path of fileOptions) {
      try {
        logDebug(`Trying path: ${path}`);
        const response = await fetch(path);
        if (response.ok) {
          logDebug(`Successfully loaded file from: ${path}`);
          return { 
            text: await response.text(),
            path: path
          };
        } else {
          logDebug(`Path ${path} returned status: ${response.status}`);
          lastError = new Error(`HTTP status ${response.status} for ${path}`);
        }
      } catch (err) {
        logDebug(`Error fetching ${path}: ${err.message}`);
        lastError = err;
      }
    }
    
    throw lastError || new Error("Failed to load file with all attempted paths");
  }
  
  /**
   * Generic error display function
   * @param {string} message - Error message to display
   * @param {HTMLElement} container - Container element to append error to
   */
  function showError(message, container) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error';
    errorElement.textContent = message;
    container.insertBefore(errorElement, container.firstChild);
    
    setTimeout(() => {
      errorElement.remove();
    }, 10000);
  }
  
  /**
   * Create and display a loading indicator
   * @param {HTMLElement} container - Container element to append loading indicator to
   * @returns {HTMLElement} The created loading element
   */
  function showLoading(container) {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.textContent = 'Loading data...';
    container.appendChild(loadingElement);
    return loadingElement;
  }
  
  /**
   * Remove a loading indicator
   * @param {HTMLElement} loadingElement - The loading element to remove
   */
  function hideLoading(loadingElement) {
    if (loadingElement) {
      loadingElement.remove();
    }
  }
  
  /**
   * Debug log functionality for the dashboard
   * @param {string} message - Message to log
   * @param {boolean} debugMode - Whether debug mode is enabled
   * @param {HTMLElement} debugOutput - Debug output element
   */
  function logDebug(message, debugMode, debugOutput) {
    if (!debugMode) return;
    
    if (debugOutput) {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      debugOutput.textContent += `[${timestamp}] ${message}\n`;
      debugOutput.scrollTop = debugOutput.scrollHeight;
    }
    
    console.log(`[DEBUG] ${message}`);
  }