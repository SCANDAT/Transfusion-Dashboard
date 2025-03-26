/**
 * Utility functions for the Transfusion Dashboard
 * Enhanced with Tesla × Apple × Stripe × TED Design System
 */

// Tab navigation functionality with animation
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
  const targetTab = document.getElementById(tabName);
  targetTab.classList.add("active");
  evt.currentTarget.classList.add("active");
  
  // Trigger animation by forcing a reflow
  targetTab.style.animation = 'none';
  targetTab.offsetHeight; // Force reflow
  targetTab.style.animation = '';
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
 * Enhanced error display function
 * @param {string} message - Error message to display
 * @param {HTMLElement} container - Container element to append error to
 */
function showError(message, container) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error';
  
  // Create icon
  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconSvg.setAttribute('width', '20');
  iconSvg.setAttribute('height', '20');
  iconSvg.setAttribute('viewBox', '0 0 24 24');
  iconSvg.setAttribute('fill', 'none');
  iconSvg.setAttribute('stroke', 'currentColor');
  iconSvg.setAttribute('stroke-width', '2');
  iconSvg.setAttribute('stroke-linecap', 'round');
  iconSvg.setAttribute('stroke-linejoin', 'round');
  
  const iconPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  iconPath1.setAttribute('cx', '12');
  iconPath1.setAttribute('cy', '12');
  iconPath1.setAttribute('r', '10');
  
  const iconPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  iconPath2.setAttribute('x1', '12');
  iconPath2.setAttribute('y1', '8');
  iconPath2.setAttribute('x2', '12');
  iconPath2.setAttribute('y2', '12');
  
  const iconPath3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  iconPath3.setAttribute('x1', '12');
  iconPath3.setAttribute('y1', '16');
  iconPath3.setAttribute('x2', '12.01');
  iconPath3.setAttribute('y2', '16');
  
  iconSvg.appendChild(iconPath1);
  iconSvg.appendChild(iconPath2);
  iconSvg.appendChild(iconPath3);
  
  // Create error message wrapper
  const messageWrapper = document.createElement('div');
  messageWrapper.style.display = 'flex';
  messageWrapper.style.alignItems = 'center';
  messageWrapper.style.gap = '10px';
  
  messageWrapper.appendChild(iconSvg);
  
  const messageText = document.createElement('span');
  messageText.textContent = message;
  messageWrapper.appendChild(messageText);
  
  errorElement.appendChild(messageWrapper);
  
  container.insertBefore(errorElement, container.firstChild);
  
  // Animate entry
  errorElement.style.opacity = '0';
  errorElement.style.transform = 'translateY(-20px)';
  errorElement.style.transition = 'opacity 0.3s, transform 0.3s';
  
  // Force reflow
  errorElement.offsetHeight;
  
  errorElement.style.opacity = '1';
  errorElement.style.transform = 'translateY(0)';
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.position = 'absolute';
  closeButton.style.right = '10px';
  closeButton.style.top = '10px';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.cursor = 'pointer';
  closeButton.style.color = 'inherit';
  closeButton.style.fontSize = '20px';
  closeButton.style.padding = '0';
  closeButton.style.lineHeight = '1';
  
  closeButton.addEventListener('click', () => {
    removeError(errorElement);
  });
  
  errorElement.style.position = 'relative';
  errorElement.appendChild(closeButton);
  
  // Auto-remove after a delay
  setTimeout(() => {
    removeError(errorElement);
  }, 10000);
  
  return errorElement;
}

/**
 * Remove error element with animation
 * @param {HTMLElement} errorElement - The error element to remove
 */
function removeError(errorElement) {
  errorElement.style.opacity = '0';
  errorElement.style.transform = 'translateY(-20px)';
  
  setTimeout(() => {
    if (errorElement.parentNode) {
      errorElement.parentNode.removeChild(errorElement);
    }
  }, 300);
}

/**
 * Create and display an enhanced loading indicator
 * @param {HTMLElement} container - Container element to append loading indicator to
 * @param {string} message - Optional message to display
 * @returns {HTMLElement} The created loading element
 */
function showLoading(container, message = 'Loading data...') {
  const loadingElement = document.createElement('div');
  loadingElement.className = 'loading';
  
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  loadingElement.appendChild(spinner);
  
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageElement.style.marginTop = '10px';
  loadingElement.appendChild(messageElement);
  
  // Add to the DOM
  if (container) {
    container.appendChild(loadingElement);
  }
  
  return loadingElement;
}

/**
 * Remove a loading indicator with fade animation
 * @param {HTMLElement} loadingElement - The loading element to remove
 */
function hideLoading(loadingElement) {
  if (loadingElement) {
    loadingElement.style.opacity = '0';
    
    setTimeout(() => {
      if (loadingElement.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
      }
    }, 300);
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
  
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  const formattedMessage = `[${timestamp}] ${message}`;
  
  if (debugOutput) {
    // Create a line for this message
    const lineElement = document.createElement('div');
    lineElement.className = 'debug-line';
    lineElement.textContent = formattedMessage;
    
    // Add the line to the output
    debugOutput.appendChild(lineElement);
    debugOutput.scrollTop = debugOutput.scrollHeight;
    
    // Keep only the last 100 lines to prevent performance issues
    const lines = debugOutput.getElementsByClassName('debug-line');
    if (lines.length > 100) {
      debugOutput.removeChild(lines[0]);
    }
  }
  
  console.log(`[DEBUG] ${message}`);
}

/**
 * Export Chart.js chart as SVG
 * @param {Chart} chart - The Chart.js chart instance
 * @param {string} filename - Name for the exported file
 */
function exportChartAsSVG(chart, filename) {
  try {
    // Track if we're in dark mode to restore it later
    const isDarkMode = !document.body.classList.contains('light-theme');
    
    // If in dark mode, temporarily switch to light mode for export
    if (isDarkMode) {
      document.body.classList.add('light-theme');
      
      // Trigger chart redraw with light theme
      const themeChangeEvent = new CustomEvent('themeChanged', {
        detail: { theme: 'light' }
      });
      document.dispatchEvent(themeChangeEvent);
      
      // Give time for chart to update with light theme
      setTimeout(() => {
        doExport();
        
        // Switch back to dark mode after export
        document.body.classList.remove('light-theme');
        
        // Trigger chart redraw with dark theme
        const darkThemeEvent = new CustomEvent('themeChanged', {
          detail: { theme: 'dark' }
        });
        document.dispatchEvent(darkThemeEvent);
      }, 300);
    } else {
      // If already in light mode, export immediately
      doExport();
    }
    
    // Helper function to perform the export
    function doExport() {
      // Create a new Image from chart's data URL
      const image = new Image();
      image.src = chart.toBase64Image();
      
      // Use standard landscape dimensions (11in × 8.5in at 96 PPI)
      const width = 1056; // 11in at 96 PPI
      const height = 816; // 8.5in at 96 PPI
      
      // Create an SVG container with standard dimensions
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      
      // Add white background rectangle to ensure visibility
      const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      background.setAttribute("width", width);
      background.setAttribute("height", height);
      background.setAttribute("fill", "white");
      svg.appendChild(background);
      
      // Add the image to SVG, ensuring it fills the entire SVG
      const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
      img.setAttribute("width", width);
      img.setAttribute("height", height);
      img.setAttribute("href", image.src);
      img.setAttribute("preserveAspectRatio", "none"); // Ensure the image fills the entire SVG
      svg.appendChild(img);
      
      // Save the SVG
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svg);
      
      // Add XML declaration
      source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
      
      // Create a blob with the SVG data
      const svgBlob = new Blob([source], {type:"image/svg+xml;charset=utf-8"});
      
      // Use FileSaver.js to save the file
      saveAs(svgBlob, filename + '.svg');
    }
    
  } catch (error) {
    console.error("Error exporting chart as SVG:", error);
    alert("Failed to export chart as SVG. See console for details.");
  }
}

/**
 * Create an SVG export button for a chart
 * @param {Chart} chart - The Chart.js chart instance
 * @param {string} filename - Base name for the exported file
 * @param {HTMLElement} container - Container to append the button to
 */
function createSvgExportButton(chart, filename, container) {
  const exportBtn = document.createElement('button');
  exportBtn.className = 'svg-export-btn';
  exportBtn.setAttribute('title', 'Export as SVG');
  
  // Create SVG icon
  const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgIcon.setAttribute('width', '16');
  svgIcon.setAttribute('height', '16');
  svgIcon.setAttribute('viewBox', '0 0 24 24');
  svgIcon.setAttribute('fill', 'none');
  svgIcon.setAttribute('stroke', 'currentColor');
  svgIcon.setAttribute('stroke-width', '2');
  svgIcon.setAttribute('stroke-linecap', 'round');
  svgIcon.setAttribute('stroke-linejoin', 'round');
  
  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
  
  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  path2.setAttribute('points', '7 10 12 15 17 10');
  
  const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  path3.setAttribute('x1', '12');
  path3.setAttribute('y1', '15');
  path3.setAttribute('x2', '12');
  path3.setAttribute('y2', '3');
  
  svgIcon.appendChild(path1);
  svgIcon.appendChild(path2);
  svgIcon.appendChild(path3);
  
  const text = document.createElement('span');
  text.textContent = 'SVG';
  
  exportBtn.appendChild(svgIcon);
  exportBtn.appendChild(text);
  
  exportBtn.addEventListener('click', () => {
    exportChartAsSVG(chart, filename);
  });
  
  container.appendChild(exportBtn);
  
  return exportBtn;
}

/**
 * Toggle dark/light theme and dispatch a theme change event
 */
function toggleTheme() {
  const body = document.body;
  
  if (body.classList.contains('light-theme')) {
    body.classList.remove('light-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.add('light-theme');
    localStorage.setItem('theme', 'light');
  }
  
  // Dispatch a custom event for chart updates
  const themeChangeEvent = new CustomEvent('themeChanged', {
    detail: { theme: body.classList.contains('light-theme') ? 'light' : 'dark' }
  });
  document.dispatchEvent(themeChangeEvent);
}

/**
 * Always apply dark theme regardless of saved preferences
 */
function applyTheme() {
  const body = document.body;
  // Remove light theme if it's present
  if (body.classList.contains('light-theme')) {
    body.classList.remove('light-theme');
  }
  // Store dark theme in localStorage for consistency
  localStorage.setItem('theme', 'dark');
}
