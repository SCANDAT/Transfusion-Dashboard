/**
 * Main dashboard class for the Transfusion Dashboard
 */
class TransfusionDashboard {
    /**
     * Create a new dashboard instance
     * @param {string} containerId - ID of the container element
     */
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      
      // State variables
      this.fileCase = 'unknown';    
      this.indexData = [];          
      this.vitalParams = [];        
      this.compFactors = [];        
      this.chartData = [];          
      this.selectedVital = '';      
      this.selectedCompFactor = ''; 
      this.comparisonValues = [];   
      this.selectedComparisons = [];
      
      // Start from transfusion time (0):
      this.timeRange = [0, 720];    
      
      this.showConfidenceInterval = true; 
      this.showBaseModel = false; 
      this.showDeltaPlot = true;   
      
      this.metaInfo = {             
        vitalName: '',
        compName: '',
        yLabel: '',
        DeltaYLabel: ''
      };
      this.currentFileName = '';    
      this.chart = null;            
      this.isInitialLoad = true;    
      this.debugMode = false;       
      
      // Keep track of previous vital & factor
      this.lastSelectedCompFactor = null;
      this.lastSelectedVital = null;
      
      // Descriptive statistics data
      this.statsData = {
        patientSexDistribution: [],
        patientAgeStats: {},
        patientAgeGroups: [],
        rbcUnitsPerPatient: [],
        uniquePatientsCount: 0,
        totalTransfusedUnits: 0,
        donorhbDistribution: [],
        storageDistribution: [],
        donorSexDistribution: [],
        donorParityDistribution: [],
        donationWeekdayDistribution: []
      };
      
      // Loading indicator element
      this.loadingElement = null;
      
      // Initialize dashboard
      this.initialize();
    }
    
    /**
     * Initialize the dashboard
     */
    async initialize() {
      try {
        // Create UI structure
        this.createUI();
        
        // Load descriptive statistics data first
        try {
          await this.loadDescriptiveStats();
          // Update the descriptive stats tab with the loaded data
          this.updateDescriptiveStatsContent();
        } catch (statsError) {
          console.error('Descriptive statistics loading error:', statsError);
          this.showError(`Failed to load descriptive statistics: ${statsError.message}`);
        }
        
        // Load index data for visualization
        try {
          await this.loadIndexData();
        } catch (loadError) {
          console.error('Visualization data loading error:', loadError);
          this.showError(`Failed to load visualization data: ${loadError.message}. Descriptive Statistics tab is still available.`);
          // Make sure the loading indicator is hidden
          this.hideLoading();
        }
        
        // Initialize the RBC Component Factors tab
        try {
          initializeRbcComponentFactors('rbc-component-factors-tab', this.fileCase, this.logDebug.bind(this));
        } catch (compFactorsError) {
          console.error('RBC Component Factors initialization error:', compFactorsError);
          this.logDebug(`Failed to initialize RBC Component Factors tab: ${compFactorsError.message}`);
        }
        
        // Initialize the RBC Transfusions tab
        try {
          initializeRbcTransfusions('rbc-transfusions-tab', this.fileCase, this.logDebug.bind(this));
        } catch (transfusionsError) {
          console.error('RBC Transfusions initialization error:', transfusionsError);
          this.logDebug(`Failed to initialize RBC Transfusions tab: ${transfusionsError.message}`);
        }
        
      } catch (error) {
        console.error('Initialization error:', error);
        this.showError(`Failed to initialize dashboard: ${error.message}`);
      }
    }
    
    /**
     * Create the dashboard UI structure
     */
    createUI() {
      // Create header
      const header = document.createElement('div');
      header.className = 'header';
      header.innerHTML = `
        <h1>Transfusion Data Visualization Dashboard</h1>
        <p>Displaying time-series data after blood transfusion</p>
      `;
      this.container.appendChild(header);
      
      // Create tab navigation (with swapped tab names to correct previous naming inconsistency)
      const tabsContainer = document.createElement('div');
      tabsContainer.className = 'tabs';
      tabsContainer.innerHTML = `
        <button class="tab-button active" onclick="openTab(event, 'descriptive-stats-tab')">Descriptive Statistics</button>
        <button class="tab-button" onclick="openTab(event, 'rbc-component-factors-tab')">RBC Component Factors</button>
        <button class="tab-button" onclick="openTab(event, 'rbc-transfusions-tab')">RBC Transfusions</button>
      `;
      this.container.appendChild(tabsContainer);
      
      // Create tab content containers
      const descriptiveStatsTab = document.createElement('div');
      descriptiveStatsTab.id = 'descriptive-stats-tab';
      descriptiveStatsTab.className = 'tab-content active';
      descriptiveStatsTab.innerHTML = '<div class="loading">Loading descriptive statistics...</div>';
      this.container.appendChild(descriptiveStatsTab);
      
      // RBC Component Factors tab (previously incorrectly named "RBC Transfusions")
      // This tab shows component factors (donor, storage) effects on vital parameters
      const rbcComponentFactorsTab = document.createElement('div');
      rbcComponentFactorsTab.id = 'rbc-component-factors-tab';
      rbcComponentFactorsTab.className = 'tab-content';
      this.container.appendChild(rbcComponentFactorsTab);
      
      // Create controls (now inside RBC Component Factors tab)
      const controls = document.createElement('div');
      controls.className = 'card controls';
      controls.innerHTML = createVisualizationControls();
      rbcComponentFactorsTab.appendChild(controls);
      
      // Create chart area
      const chartCard = document.createElement('div');
      chartCard.className = 'card';
      chartCard.innerHTML = createChartArea();
      rbcComponentFactorsTab.appendChild(chartCard);
      
      // Info card for Vital Parameters and RBC factors
      const infoCard = document.createElement('div');
      infoCard.className = 'card';
      infoCard.innerHTML = createInfoCard();
      rbcComponentFactorsTab.appendChild(infoCard);
      
      // RBC Transfusions tab (new correct naming)
      // This tab shows transfusion effects on vital parameters
      const rbcTransfusionsTab = document.createElement('div');
      rbcTransfusionsTab.id = 'rbc-transfusions-tab';
      rbcTransfusionsTab.className = 'tab-content';
      rbcTransfusionsTab.innerHTML = createRbcTransfusionsContent();
      this.container.appendChild(rbcTransfusionsTab);
      
      // Add event listeners
      this.addEventListeners();
      
      // Check URL for debug flag
      if (window.location.search.includes('debug=true')) {
        document.getElementById('debug-container').style.display = 'block';
        document.getElementById('debug-mode').checked = true;
        this.debugMode = true;
        document.getElementById('debug-output').style.display = 'block';
        this.logDebug('Debug mode enabled via URL parameter');
      }
      
      // Reflect initial state
      document.getElementById('show-ci').checked = this.showConfidenceInterval;
      document.getElementById('show-base').checked = this.showBaseModel;
      document.getElementById('show-delta').checked = this.showDeltaPlot;
    }
    
    /**
     * Add event listeners to interactive elements
     */
    addEventListeners() {
      document.getElementById('vital-select').addEventListener('change', (e) => {
        this.selectedVital = e.target.value;
        this.updateCompFactors();
      });
      
      document.getElementById('factor-select').addEventListener('change', (e) => {
        this.selectedCompFactor = e.target.value;
        this.loadVisualizationData();
      });
      
      document.getElementById('time-min').addEventListener('change', (e) => {
        this.timeRange[0] = parseInt(e.target.value);
        this.updateChart();
      });
      
      document.getElementById('time-max').addEventListener('change', (e) => {
        this.timeRange[1] = parseInt(e.target.value);
        this.updateChart();
      });
      
      document.getElementById('time-reset').addEventListener('click', () => {
        this.timeRange = [0, 720];
        document.getElementById('time-min').value = 0;
        document.getElementById('time-max').value = 720;
        this.updateChart();
      });
      
      document.getElementById('show-ci').addEventListener('change', (e) => {
        this.showConfidenceInterval = e.target.checked;
        this.updateChart();
      });
      
      document.getElementById('show-base').addEventListener('change', (e) => {
        this.showBaseModel = e.target.checked;
        this.updateChart();
      });
      
      document.getElementById('show-delta').addEventListener('change', (e) => {
        this.showDeltaPlot = e.target.checked;
        this.updateChart();
      });
      
      // Debug mode
      document.getElementById('debug-mode').addEventListener('change', (e) => {
        this.debugMode = e.target.checked;
        document.getElementById('debug-output').style.display = this.debugMode ? 'block' : 'none';
        if (this.debugMode) {
          this.logDebug('Debug mode enabled');
        }
      });
    }
    
    /**
     * Load all descriptive statistics data
     */
    async loadDescriptiveStats() {
      this.showLoading();
      
      try {
        // Load all statistics files in parallel
        const [
          patientSexDistribution,
          patientAgeStats,
          patientAgeGroups,
          rbcUnitsPerPatient,
          uniquePatientsCount,
          totalTransfusedUnits,
          donorhbDistribution,
          storageDistribution,
          donorSexDistribution,
          donorParityDistribution,
          donationWeekdayDistribution
        ] = await Promise.all([
          loadPatientSexDistribution(this.fileCase, this.logDebug.bind(this)),
          loadPatientAgeStats(this.fileCase, this.logDebug.bind(this)),
          loadPatientAgeGroups(this.fileCase, this.logDebug.bind(this)),
          loadRbcUnitsPerPatient(this.fileCase, this.logDebug.bind(this)),
          loadUniquePatientsCount(this.fileCase, this.logDebug.bind(this)),
          loadTotalTransfusedUnits(this.fileCase, this.logDebug.bind(this)),
          loadDonorhbDistribution(this.fileCase, this.logDebug.bind(this)),
          loadStorageDistribution(this.fileCase, this.logDebug.bind(this)),
          loadDonorSexDistribution(this.fileCase, this.logDebug.bind(this)),
          loadDonorParityDistribution(this.fileCase, this.logDebug.bind(this)),
          loadDonationWeekdayDistribution(this.fileCase, this.logDebug.bind(this))
        ]);
        
        // Update stats data object
        this.statsData = {
          patientSexDistribution,
          patientAgeStats,
          patientAgeGroups,
          rbcUnitsPerPatient,
          uniquePatientsCount,
          totalTransfusedUnits,
          donorhbDistribution,
          storageDistribution,
          donorSexDistribution,
          donorParityDistribution,
          donationWeekdayDistribution
        };
        
        this.logDebug('All descriptive statistics loaded successfully');
        
      } catch (error) {
        this.logDebug(`Error loading descriptive statistics: ${error.message}`);
        throw error;
      } finally {
        this.hideLoading();
      }
    }
    
    /**
     * Update the descriptive statistics tab with loaded data
     */
    updateDescriptiveStatsContent() {
      const descriptiveStatsTab = document.getElementById('descriptive-stats-tab');
      if (descriptiveStatsTab) {
        descriptiveStatsTab.innerHTML = createDescriptiveStatsContent(this.statsData);
      }
    }
    
    /**
     * Load index data for visualization
     */
    async loadIndexData() {
      try {
        this.showLoading();
        this.logDebug("Attempting to load index data...");
        
        const indexFileOptions = [
          { case: 'lowercase', path: './data/viz_index.csv' },
          { case: 'uppercase', path: './data/VIZ_INDEX.CSV' }
        ];
        
        let csvText = null;
        
        for (const option of indexFileOptions) {
          try {
            this.logDebug(`Trying ${option.case} index file: ${option.path}`);
            const response = await fetch(option.path);
            
            if (response.ok) {
              csvText = await response.text();
              this.fileCase = option.case;
              this.logDebug(`Successfully loaded ${option.case} index file`);
              break;
            } else {
              this.logDebug(`${option.case} index file returned status: ${response.status}`);
            }
          } catch (err) {
            this.logDebug(`Error loading ${option.case} index file: ${err.message}`);
          }
        }
        
        if (!csvText) {
          throw new Error("Could not load index file in either uppercase or lowercase format");
        }
        
        this.logDebug("Parsing index CSV...");
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors && results.errors.length > 0) {
              this.logDebug(`CSV parse errors: ${JSON.stringify(results.errors)}`);
            }
            
            this.logDebug(`CSV parsed successfully, found ${results.data.length} rows`);
            
            this.indexData = results.data.map(row => {
              const cleanRow = {};
              Object.keys(row).forEach(key => {
                cleanRow[key] = typeof row[key] === 'string' ? row[key].trim() : row[key];
              });
              return cleanRow;
            });
            
            // Gather unique vital parameters
            let unsortedVitals = _.uniqBy(this.indexData, 'VitalParam')
              .map(item => ({
                value: item.VitalParam,
                label: item.VitalName 
                  ? item.VitalName.replace('Vital Parameter Trajectory: ', '') 
                  : item.VitalParam
              }));
            
            // 1) We reorder them to the user-requested sequence
            const desiredOrder = [
              'Mean Arterial Pressure (mmHg)',
              'Systolic Blood Pressure (mmHg)',
              'Diastolic Blood Pressure (mmHg)',
              'Heart Rate (bpm)',
              'Fraction of Inspired Oxygen (%)',
              'Peripheral Capillary Oxygen Saturation (%)',
              'Minute Ventilation (L/min)'
            ];
            
            // Sort vitals by that custom order
            this.vitalParams = unsortedVitals.sort((a, b) => {
              const i1 = desiredOrder.indexOf(a.label);
              const i2 = desiredOrder.indexOf(b.label);
              
              // If both are found, compare indexes
              if (i1 !== -1 && i2 !== -1) {
                return i1 - i2;
              }
              // If one is missing from desired list, push it after the known ones
              if (i1 === -1 && i2 === -1) {
                // fallback: normal alphabetical
                return a.label.localeCompare(b.label);
              } else if (i1 === -1) {
                return 1;
              } else if (i2 === -1) {
                return -1;
              }
              return 0; 
            });
            
            this.logDebug(`Reordered vitalParams: ${this.vitalParams.map(v => v.label).join(', ')}`);
            
            // Default vital param: "Mean Arterial Pressure (mmHg)" if it exists
            const desiredVital = this.vitalParams.find(v => v.label === 'Mean Arterial Pressure (mmHg)');
            if (desiredVital) {
              this.selectedVital = desiredVital.value;
            } else if (this.vitalParams.length > 0) {
              this.selectedVital = this.vitalParams[0].value;
            } else {
              this.logDebug("No vital parameters found in index data after reorder");
              this.showError("No vital parameters found in index data. Check CSV format.");
              this.hideLoading();
              return;
            }
            
            this.logDebug(`Selected initial vital parameter: ${this.selectedVital}`);
            
            // Populate dropdown, then factor
            this.updateVitalSelect();
            this.updateCompFactors();
            
            this.hideLoading();
          },
          error: (error) => {
            this.logDebug(`CSV parse error: ${error.message}`);
            throw new Error(`CSV parse error: ${error.message}`);
          }
        });
      } catch (error) {
        this.logDebug(`Failed to load index data: ${error.message}`);
        this.hideLoading();
        this.showError(`Failed to load index data: ${error.message}`);
      }
    }
    
    /**
     * Update RBC component factors based on the selected vital parameter
     */
    updateCompFactors() {
      if (!this.selectedVital || this.indexData.length === 0) return;
      
      const relevantFactors = this.indexData.filter(item => item.VitalParam === this.selectedVital);
      this.logDebug(`Found ${relevantFactors.length} comparison factors for vital ${this.selectedVital}`);
      
      this.compFactors = relevantFactors.map(item => ({
        value: item.CompFactor,
        label: item.CompName || item.CompFactor
      }));
      
      // Update the RBC factor dropdown
      this.updateCompFactorSelect();
      
      // Check if the user's current RBC factor is still valid
      const isUserFactorValid = this.compFactors.some(f => f.value === this.selectedCompFactor);
      
      // If it's not valid, pick "Donor Hemoglobin" if it exists, otherwise first factor
      if (!isUserFactorValid) {
        const donorHb = this.compFactors.find(f => f.label === 'Donor Hemoglobin');
        if (donorHb) {
          this.selectedCompFactor = donorHb.value;
        } else if (this.compFactors.length > 0) {
          this.selectedCompFactor = this.compFactors[0].value;
        } else {
          this.logDebug("No comparison factors found for selected vital parameter");
          this.showError(`No comparison factors found for ${this.selectedVital}`);
          return;
        }
      }
      
      this.logDebug(`Final RBC factor selection: ${this.selectedCompFactor}`);
      
      // Make sure the dropdown reflects the final selection
      const select = document.getElementById('factor-select');
      if (select) {
        select.value = this.selectedCompFactor;
      }
      
      // Load new data with the final factor
      this.loadVisualizationData();
    }
    
    /**
     * Populate the vital parameter dropdown
     */
    updateVitalSelect() {
      const select = document.getElementById('vital-select');
      select.innerHTML = '';
      
      this.vitalParams.forEach(vital => {
        const option = document.createElement('option');
        option.value = vital.value;
        option.textContent = vital.label;
        select.appendChild(option);
      });
      
      select.value = this.selectedVital;
    }
    
    /**
     * Populate the RBC factor dropdown
     */
    updateCompFactorSelect() {
      const select = document.getElementById('factor-select');
      select.innerHTML = '';
      
      this.compFactors.forEach(factor => {
        const option = document.createElement('option');
        option.value = factor.value;
        option.textContent = factor.label;
        select.appendChild(option);
      });
    }
    
    /**
     * Load visualization data for the current vital parameter and component factor
     */
    async loadVisualizationData() {
      if (!this.selectedVital || !this.selectedCompFactor) return;
      
      try {
        this.showLoading();
        
        const oldFactor = this.lastSelectedCompFactor;
        const oldVital = this.lastSelectedVital;
        const factorChanged = (oldFactor !== null && oldFactor !== this.selectedCompFactor);
        const vitalChanged = (oldVital !== null && oldVital !== this.selectedVital);
        
        // Update stored values
        this.lastSelectedCompFactor = this.selectedCompFactor;
        this.lastSelectedVital = this.selectedVital;
        
        // Load the visualization data
        const result = await loadVisualizationData(
          this.selectedVital,
          this.selectedCompFactor,
          this.fileCase,
          this.logDebug.bind(this)
        );
        
        this.chartData = {
          data: result.data,
          comparisonColumn: result.comparisonColumn
        };
        
        this.metaInfo = result.metaInfo;
        this.currentFileName = result.currentFileName;
        this.comparisonValues = result.comparisonValues;
        
        // Keep track of the old selectedComparisons
        const oldSelection = [...this.selectedComparisons];
        
        // Decide how to set selectedComparisons
        if (this.isInitialLoad) {
          this.logDebug("Initial load => show all categories except null");
          this.selectedComparisons = this.comparisonValues.filter(v => v !== null);
          this.isInitialLoad = false;
        } else if (factorChanged) {
          this.logDebug("RBC factor changed => show all categories except null");
          this.selectedComparisons = this.comparisonValues.filter(v => v !== null);
        } else {
          // Vital changed or user reloaded same combos => preserve old selection if valid
          this.logDebug("Vital changed => keep old selection intersection if valid");
          this.selectedComparisons = oldSelection.filter(v => this.comparisonValues.includes(v));
        }
        
        this.logDebug(`Final selectedComparisons => ${this.selectedComparisons.join(', ')}`);
        
        // Update chart title
        document.getElementById('chart-title').innerHTML = `
          <h2>${this.showDeltaPlot ? 'Change in ' : ''}${this.metaInfo.vitalName} by ${this.metaInfo.compName}</h2>
        `;
        
        // Model descriptions
        document.getElementById('model-descriptions').innerHTML = `
          <div style="display: flex; justify-content: center; gap: 20px;">
            <div style="padding: 5px 10px; border-left: 4px solid #3b82f6;">
              <span style="font-weight: bold;">Base Model:</span> Base Model: A mixed-effects model with a random intercept for patient ID that adjusts for time from transfusion (natural cubic spline with fixed knots at -660, -360, -60, 0, 60, 360, and 660 minutes), patient age and time spent in the ICU prior to transfusion (natural cubic splines with three percentile-based knots), RBC transfusion count, patient sex, and ICU ward name
            </div>
            <div style="padding: 5px 10px; border-left: 4px solid #3b82f6;">
              <span style="font-weight: bold;">Fully Adjusted Model:</span> A mixed-effects model containing all base model variables as well as cumulative crystalloid fluids and vasopressors administered (in ml) in the last 1 and 24 hours prior to transfusion (natural cubic splines with three percentile-based knots), and a binary variable for whether sedatives were administered in the last 1 and 24 hours prior to transfusion 
            </div>
          </div>
        `;
        
        // Update comparison tags
        const tagsContainer = document.getElementById('comparison-tags');
        createComparisonTags(
          this.comparisonValues,
          this.selectedComparisons,
          this.selectedCompFactor,
          tagsContainer,
          (value) => {
            // Toggle the selected comparison
            if (this.selectedComparisons.includes(value)) {
              this.selectedComparisons = this.selectedComparisons.filter(v => v !== value);
            } else {
              this.selectedComparisons.push(value);
            }
            this.updateChart();
          }
        );
        
        // Time range inputs
        document.getElementById('time-min').value = this.timeRange[0];
        document.getElementById('time-max').value = this.timeRange[1];
        
        // Render
        this.updateChart();
        
        this.hideLoading();
      } catch (error) {
        this.logDebug(`Failed to load visualization data: ${error.message}`);
        this.hideLoading();
        this.showError(`Failed to load visualization data: ${error.message}`);
      }
    }
    
    /**
     * Update the chart with current settings
     */
    updateChart() {
      const chartData = prepareChartData(
        this.chartData,
        this.selectedComparisons,
        this.timeRange,
        this.showDeltaPlot,
        this.showConfidenceInterval,
        this.showBaseModel,
        this.selectedCompFactor,
        this.comparisonValues
      );
      
      if (!chartData) {
        this.clearChart();
        return;
      }
      
      this.chart = renderChart(
        chartData,
        this.metaInfo,
        this.timeRange,
        this.showDeltaPlot,
        this.selectedVital,
        this.chart
      );
    }
    
    /**
     * Clear the current chart
     */
    clearChart() {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    }
    
    /**
     * Show an error message
     * @param {string} message - The error message to display
     */
    showError(message) {
      showError(message, this.container);
    }
    
    /**
     * Show a loading indicator
     */
    showLoading() {
      // Create a loading indicator if it doesn't already exist
      if (!this.loadingElement) {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading';
        loadingElement.textContent = 'Loading data...';
        this.container.appendChild(loadingElement);
        this.loadingElement = loadingElement;
      }
    }
    
    /**
     * Hide the loading indicator
     */
    hideLoading() {
      // Check if loadingElement exists before removing it
      if (this.loadingElement) {
        this.loadingElement.remove();
        this.loadingElement = null;
      }
    }
    
    /**
     * Log a debug message
     * @param {string} message - The message to log
     */
    logDebug(message) {
      logDebug(message, this.debugMode, document.getElementById('debug-output'));
    }
  }
