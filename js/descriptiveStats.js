/**
 * Descriptive statistics functionality for the Transfusion Dashboard
 * 
 * Includes data loading, processing, and visualization capabilities
 */

/**
 * Load and parse a CSV file containing patient sex distribution data
 * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
 * @param {Function} logDebug - Debug logging function
 * @returns {Promise<Array>} Array of patient sex distribution data objects
 */
async function loadPatientSexDistribution(fileCase, logDebug) {
    try {
      const { text } = await safeFetch('patient_sex_distribution', fileCase, logDebug);
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              logDebug(`Loaded patient sex distribution: ${results.data.length} rows`);
              resolve(results.data);
            } else {
              reject(new Error("No patient sex distribution data found"));
            }
          },
          error: reject
        });
      });
    } catch (error) {
      logDebug(`Error loading patient sex distribution: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load and parse a CSV file containing patient age statistics
   * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
   * @param {Function} logDebug - Debug logging function
   * @returns {Promise<Object>} Patient age statistics object
   */
  async function loadPatientAgeStats(fileCase, logDebug) {
    try {
      const { text } = await safeFetch('patient_age_stats', fileCase, logDebug);
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              logDebug(`Loaded patient age stats`);
              resolve(results.data[0]);
            } else {
              reject(new Error("No patient age stats data found"));
            }
          },
          error: reject
        });
      });
    } catch (error) {
      logDebug(`Error loading patient age stats: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load and parse a CSV file containing patient age group distribution
   * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
   * @param {Function} logDebug - Debug logging function
   * @returns {Promise<Array>} Array of patient age group data objects
   */
  async function loadPatientAgeGroups(fileCase, logDebug) {
    try {
      const { text } = await safeFetch('patient_age_groups', fileCase, logDebug);
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              logDebug(`Loaded patient age groups: ${results.data.length} rows`);
              resolve(results.data);
            } else {
              reject(new Error("No patient age groups data found"));
            }
          },
          error: reject
        });
      });
    } catch (error) {
      logDebug(`Error loading patient age groups: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load and parse a CSV file containing RBC units per patient data
   * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
   * @param {Function} logDebug - Debug logging function
   * @returns {Promise<Array>} Array of RBC units per patient data objects
   */
  async function loadRbcUnitsPerPatient(fileCase, logDebug) {
    try {
      const { text } = await safeFetch('rbc_units_per_patient', fileCase, logDebug);
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              logDebug(`Loaded RBC units per patient: ${results.data.length} rows`);
              resolve(results.data);
            } else {
              reject(new Error("No RBC units per patient data found"));
            }
          },
          error: reject
        });
      });
    } catch (error) {
      logDebug(`Error loading RBC units per patient: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load and parse a CSV file containing unique patients count
   * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
   * @param {Function} logDebug - Debug logging function
   * @returns {Promise<number>} Count of unique patients
   */
  async function loadUniquePatientsCount(fileCase, logDebug) {
    try {
      const { text } = await safeFetch('unique_patients_count', fileCase, logDebug);
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const count = results.data[0].No_of_Unique_Patients;
              logDebug(`Loaded unique patients count: ${count}`);
              resolve(count);
            } else {
              reject(new Error("No unique patients count data found"));
            }
          },
          error: reject
        });
      });
    } catch (error) {
      logDebug(`Error loading unique patients count: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load and parse a CSV file containing total transfused units
   * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
   * @param {Function} logDebug - Debug logging function
   * @returns {Promise<number>} Count of total transfused units
   */
  async function loadTotalTransfusedUnits(fileCase, logDebug) {
    try {
      const { text } = await safeFetch('total_transfused_units', fileCase, logDebug);
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const count = results.data[0].No_of_Transfused_Units;
              logDebug(`Loaded total transfused units: ${count}`);
              resolve(count);
            } else {
              reject(new Error("No total transfused units data found"));
            }
          },
          error: reject
        });
      });
    } catch (error) {
      logDebug(`Error loading total transfused units: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load and parse a CSV file containing donor hemoglobin distribution
   * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
   * @param {Function} logDebug - Debug logging function
   * @returns {Promise<Array>} Array of donor hemoglobin distribution data objects
   */
  async function loadDonorhbDistribution(fileCase, logDebug) {
    try {
      const { text } = await safeFetch('donorhb_distribution', fileCase, logDebug);
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              logDebug(`Loaded donor hemoglobin distribution: ${results.data.length} rows`);
              resolve(results.data);
            } else {
              reject(new Error("No donor hemoglobin distribution data found"));
            }
          },
          error: reject
        });
      });
    } catch (error) {
      logDebug(`Error loading donor hemoglobin distribution: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load and parse a CSV file containing storage distribution
   * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
   * @param {Function} logDebug - Debug logging function
   * @returns {Promise<Array>} Array of storage distribution data objects
   */
  async function loadStorageDistribution(fileCase, logDebug) {
    try {
      const { text } = await safeFetch('storage_distribution', fileCase, logDebug);
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              logDebug(`Loaded storage distribution: ${results.data.length} rows`);
              resolve(results.data);
            } else {
              reject(new Error("No storage distribution data found"));
            }
          },
          error: reject
        });
      });
    } catch (error) {
      logDebug(`Error loading storage distribution: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load and parse a CSV file containing donor sex distribution
   * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
   * @param {Function} logDebug - Debug logging function
   * @returns {Promise<Array>} Array of donor sex distribution data objects
   */
  async function loadDonorSexDistribution(fileCase, logDebug) {
    try {
      const { text } = await safeFetch('donor_sex_distribution', fileCase, logDebug);
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              logDebug(`Loaded donor sex distribution: ${results.data.length} rows`);
              resolve(results.data);
            } else {
              reject(new Error("No donor sex distribution data found"));
            }
          },
          error: reject
        });
      });
    } catch (error) {
      logDebug(`Error loading donor sex distribution: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load and parse a CSV file containing donor parity distribution
   * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
   * @param {Function} logDebug - Debug logging function
   * @returns {Promise<Array>} Array of donor parity distribution data objects
   */
  async function loadDonorParityDistribution(fileCase, logDebug) {
    try {
      const { text } = await safeFetch('donor_parity_distribution', fileCase, logDebug);
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              logDebug(`Loaded donor parity distribution: ${results.data.length} rows`);
              resolve(results.data);
            } else {
              reject(new Error("No donor parity distribution data found"));
            }
          },
          error: reject
        });
      });
    } catch (error) {
      logDebug(`Error loading donor parity distribution: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load and parse a CSV file containing donation weekday distribution
   * @param {string} fileCase - File case style ('uppercase', 'lowercase', or 'unknown')
   * @param {Function} logDebug - Debug logging function
   * @returns {Promise<Array>} Array of donation weekday distribution data objects
   */
  async function loadDonationWeekdayDistribution(fileCase, logDebug) {
    try {
      const { text } = await safeFetch('donation_weekday_distribution', fileCase, logDebug);
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              logDebug(`Loaded donation weekday distribution: ${results.data.length} rows`);
              resolve(results.data);
            } else {
              reject(new Error("No donation weekday distribution data found"));
            }
          },
          error: reject
        });
      });
    } catch (error) {
      logDebug(`Error loading donation weekday distribution: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Redistribute 'U' (undefined) values proportionally to other categories
   * @param {Array} data - The array of category data
   * @param {string} categoryField - Field name for the category
   * @param {string} countField - Field name for the count
   * @returns {Array} The data with 'U' values redistributed
   */
  function redistributeUndefinedValues(data, categoryField, countField) {
    // Clone the original data to avoid modifying it directly
    const processedData = JSON.parse(JSON.stringify(data));
    
    // Find the 'U' row if it exists
    const uRow = processedData.find(row => row[categoryField] === 'U');
    if (!uRow) return processedData; // No 'U' row found
    
    // Calculate total count excluding 'U'
    const relevantRows = processedData.filter(row => row[categoryField] !== 'U');
    const totalExcludingU = relevantRows.reduce((sum, row) => sum + row[countField], 0);
    
    // If there are no other categories or total is 0, just return the original data
    if (totalExcludingU === 0 || relevantRows.length === 0) return processedData;
    
    // Calculate distribution ratios and redistribute 'U' counts
    const uCount = uRow[countField];
    let remainingToDistribute = uCount;
    
    // Distribute proportionally, ensuring whole numbers
    for (let i = 0; i < relevantRows.length; i++) {
      const row = relevantRows[i];
      const ratio = row[countField] / totalExcludingU;
      
      // If this is the last row, give it all remaining counts to ensure total stays the same
      if (i === relevantRows.length - 1) {
        row[countField] += remainingToDistribute;
      } else {
        // Calculate share with rounding to whole number
        const share = Math.round(uCount * ratio);
        row[countField] += share;
        remainingToDistribute -= share;
      }
    }
    
    // Return the data without the 'U' row
    return processedData.filter(row => row[categoryField] !== 'U');
  }
  
  /**
   * Rename category labels according to a mapping
   * @param {Array} data - The array of category data
   * @param {string} categoryField - Field name for the category
   * @param {Object} labelMap - Mapping from original labels to new labels
   * @returns {Array} The data with renamed categories
   */
  function renameCategories(data, categoryField, labelMap) {
    return data.map(row => {
      const newRow = {...row};
      if (labelMap[row[categoryField]]) {
        newRow[categoryField] = labelMap[row[categoryField]];
      }
      return newRow;
    });
  }
  
  /**
   * Sort data by a custom order for categories
   * @param {Array} data - The array of category data
   * @param {string} categoryField - Field name for the category
   * @param {Array} sortOrder - Array of category values in desired sort order
   * @returns {Array} The sorted data
   */
  function sortByCustomOrder(data, categoryField, sortOrder) {
    return [...data].sort((a, b) => {
      const indexA = sortOrder.indexOf(a[categoryField]);
      const indexB = sortOrder.indexOf(b[categoryField]);
      
      // If category not in sort order, put it at the end
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  }
  
  /**
   * Generate chart for patient sex distribution
   * @param {Array} data - Patient sex distribution data
   * @param {string} canvasId - ID of the canvas element
   * @returns {Chart} The created chart instance
   */
  function createPatientSexChart(data, canvasId) {
    // Process data for the chart
    const processedData = redistributeUndefinedValues(data, 'Patient_Sex', 'No_of_Patients');
    
    // Filter out any total rows
    const filteredData = processedData.filter(row => row.Patient_Sex !== 'Total');
    
    const labels = filteredData.map(row => row.Patient_Sex);
    const values = filteredData.map(row => row.No_of_Patients);
    
    // Color palette with dark red for F, dark blue for M
    const backgroundColors = [
      'rgba(170, 15, 25, 0.8)',   // Dark red (female)
      'rgba(25, 80, 150, 0.8)',   // Dark blue (male)
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)'
    ];
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${context.label}: ${formatNumber(value)} (${percentage}%)`;
              }
            }
          },
          title: {
            display: true,
            text: 'Patient Sex Distribution',
            font: {
              size: 16
            }
          }
        }
      }
    });
  }
  
  /**
   * Generate chart for patient age groups
   * @param {Array} data - Patient age groups data
   * @param {string} canvasId - ID of the canvas element
   * @returns {Chart} The created chart instance
   */
function createPatientAgeGroupsChart(data, canvasId) {
    // Define the mapping for age group renaming
    const ageGroupMap = {
      '<20': '<20 years',
      '20-': '20-29 years',
      '30-': '30-39 years',
      '40-': '40-49 years',
      '50-': '50-59 years',
      '60-': '60-69 years',
      '70-': '70-79 years',
      '80+': '80 years or older'
    };
    
    // Define the custom sort order for age groups
    const ageGroupSortOrder = [
      '<20 years',
      '20-29 years',
      '30-39 years',
      '40-49 years',
      '50-59 years',
      '60-69 years',
      '70-79 years',
      '80 years or older'
    ];
    
    // Process the data
    const processedData = redistributeUndefinedValues(data, 'Age_Group', 'COUNT');
    const renamedData = renameCategories(processedData, 'Age_Group', ageGroupMap);
    const sortedData = sortByCustomOrder(renamedData, 'Age_Group', ageGroupSortOrder);
    
    const labels = sortedData.map(row => row.Age_Group);
    const values = sortedData.map(row => row.COUNT);
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Patients',
          data: values,
          backgroundColor: 'rgba(170, 15, 25, 0.8)', // Darker blood red
          borderColor: 'rgba(170, 15, 25, 1)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Remove legend
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `Patients: ${formatNumber(value)} (${percentage}%)`;
              }
            }
          },
          title: {
            display: true,
            text: 'Patient Age Distribution',
            font: {
              size: 16
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Number of Patients'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Age Group'
            }
          }
        }
      }
    });
  }
  
  /**
   * Generate chart for RBC units per patient
   * @param {Array} data - RBC units per patient data
   * @param {string} canvasId - ID of the canvas element
   * @returns {Chart} The created chart instance
   */
  function createRbcUnitsChart(data, canvasId) {
    // Process the data
    const processedData = redistributeUndefinedValues(data, 'Unit_Category', 'COUNT');
    
    const labels = processedData.map(row => row.Unit_Category);
    const values = processedData.map(row => row.COUNT);
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Patients',
          data: values,
          backgroundColor: 'rgba(170, 15, 25, 0.8)', // Darker blood red
          borderColor: 'rgba(170, 15, 25, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Remove legend
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `Patients: ${formatNumber(value)} (${percentage}%)`;
              }
            }
          },
          title: {
            display: true,
            text: 'RBC Units Received Per Patient',
            font: {
              size: 16
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Number of RBC Units'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Number of Patients'
            },
            beginAtZero: true
          }
        }
      }
    });
  }
  
  /**
   * Generate chart for donor hemoglobin distribution
   * @param {Array} data - Donor hemoglobin distribution data
   * @param {string} canvasId - ID of the canvas element
   * @param {number} totalUnits - Total number of transfused units
   * @returns {Chart} The created chart instance
   */
  function createDonorHbChart(data, canvasId, totalUnits) {
    // Define the mapping for hemoglobin category renaming
    const hbCategoryMap = {
      '>=170': '170 or higher'
    };
    
    // Define the custom sort order for hemoglobin categories
    const hbSortOrder = [
      '<125',
      '125-139',
      '140-154',
      '155-169',
      '170 or higher'
    ];
    
    // Process the data
    const processedData = redistributeUndefinedValues(data, 'donorhb_category', 'No_of_Transfused_Units');
    const renamedData = renameCategories(processedData, 'donorhb_category', hbCategoryMap);
    const sortedData = sortByCustomOrder(renamedData, 'donorhb_category', hbSortOrder);
    
    const labels = sortedData.map(row => row.donorhb_category);
    const values = sortedData.map(row => row.No_of_Transfused_Units);
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Units',
          data: values,
          backgroundColor: 'rgba(170, 15, 25, 0.8)', // Darker blood red
          borderColor: 'rgba(170, 15, 25, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Remove legend
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const percentage = Math.round((value / totalUnits) * 100);
                return `Units: ${formatNumber(value)} (${percentage}%)`;
              }
            }
          },
          title: {
            display: true,
            text: 'Donor Hemoglobin Distribution',
            font: {
              size: 16
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Hemoglobin (g/L)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Number of RBC Units'
            },
            beginAtZero: true
          }
        }
      }
    });
  }
  
  /**
   * Generate chart for storage distribution
   * @param {Array} data - Storage distribution data
   * @param {string} canvasId - ID of the canvas element
   * @param {number} totalUnits - Total number of transfused units
   * @returns {Chart} The created chart instance
   */
  function createStorageChart(data, canvasId, totalUnits) {
    // Define the mapping for storage category renaming
    const storageCategoryMap = {
      '<10': '<10 days',
      '10-19': '10-19 days',
      '20-29': '20-29 days',
      '30-39': '30-39 days',
      '>=40': '40 days or more'
    };
    
    // Define the custom sort order for storage categories
    const storageSortOrder = [
      '<10 days',
      '10-19 days',
      '20-29 days',
      '30-39 days',
      '40 days or more'
    ];
    
    // Process the data
    const processedData = redistributeUndefinedValues(data, 'storagecat', 'No_of_Transfused_Units');
    const renamedData = renameCategories(processedData, 'storagecat', storageCategoryMap);
    const sortedData = sortByCustomOrder(renamedData, 'storagecat', storageSortOrder);
    
    const labels = sortedData.map(row => row.storagecat);
    const values = sortedData.map(row => row.No_of_Transfused_Units);
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Units',
          data: values,
          backgroundColor: 'rgba(170, 15, 25, 0.8)', // Darker blood red
          borderColor: 'rgba(170, 15, 25, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Remove legend
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const percentage = Math.round((value / totalUnits) * 100);
                return `Units: ${formatNumber(value)} (${percentage}%)`;
              }
            }
          },
          title: {
            display: true,
            text: 'RBC Storage Time Distribution',
            font: {
              size: 16
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Storage Time'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Number of RBC Units'
            },
            beginAtZero: true
          }
        }
      }
    });
  }
  
  /**
   * Generate chart for donor sex distribution
   * @param {Array} data - Donor sex distribution data
   * @param {string} canvasId - ID of the canvas element
   * @param {number} totalUnits - Total number of transfused units
   * @returns {Chart} The created chart instance
   */
  function createDonorSexChart(data, canvasId, totalUnits) {
    // Process the data
    const processedData = redistributeUndefinedValues(data, 'donor_sex_label', 'No_of_Transfused_Units');
    
    // Filter out total rows
    const filteredData = processedData.filter(row => row.donor_sex_label !== 'Total');
    
    const labels = filteredData.map(row => row.donor_sex_label);
    const values = filteredData.map(row => row.No_of_Transfused_Units);
    
    // Colors for male/female (dark red for F, dark blue for M)
    const backgroundColors = [
      'rgba(170, 15, 25, 0.8)',   // Dark red (female)
      'rgba(25, 80, 150, 0.8)'    // Dark blue (male)
    ];
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const percentage = Math.round((value / totalUnits) * 100);
                return `${context.label}: ${formatNumber(value)} (${percentage}%)`;
              }
            }
          },
          title: {
            display: true,
            text: 'Donor Sex Distribution',
            font: {
              size: 16
            }
          }
        }
      }
    });
  }
  
  /**
   * Generate chart for donor parity distribution
   * @param {Array} data - Donor parity distribution data
   * @param {string} canvasId - ID of the canvas element
   * @param {number} totalUnits - Total number of transfused units
   * @returns {Chart} The created chart instance
   */
  function createDonorParityChart(data, canvasId, totalUnits) {
    // Process the data
    const processedData = redistributeUndefinedValues(data, 'donor_parity_label', 'No_of_Transfused_Units');
    
    // Map numeric values to readable labels
    const labels = processedData.map(row => row.donor_parity_label === 0 ? 'Nulliparous' : 'Parous');
    const values = processedData.map(row => row.No_of_Transfused_Units);
    
    const backgroundColors = [
      'rgba(170, 15, 25, 0.8)',   // Dark red for nulliparous
      'rgba(120, 15, 25, 0.8)'    // Slightly lighter red for parous
    ];
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const percentage = Math.round((value / totalUnits) * 100);
                return `${context.label}: ${formatNumber(value)} (${percentage}%)`;
              }
            }
          },
          title: {
            display: true,
            text: 'Donor Parity Distribution',
            font: {
              size: 16
            }
          }
        }
      }
    });
  }
  
  /**
   * Generate chart for donation weekday distribution
   * @param {Array} data - Donation weekday distribution data
   * @param {string} canvasId - ID of the canvas element
   * @param {number} totalUnits - Total number of transfused units
   * @returns {Chart} The created chart instance
   */
  function createWeekdayChart(data, canvasId, totalUnits) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Process the data
    const processedData = redistributeUndefinedValues(data, 'wdy_donation', 'No_of_Transfused_Units');
    
    // Sort by day of week and create labels
    const sortedData = [...processedData].sort((a, b) => a.wdy_donation - b.wdy_donation);
    const dayNames = sortedData.map(row => days[row.wdy_donation - 1] || `Day ${row.wdy_donation}`);
    const values = sortedData.map(row => row.No_of_Transfused_Units);
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
      type: 'radar',
      data: {
        labels: dayNames,
        datasets: [{
          label: 'Number of Units',
          data: values,
          backgroundColor: 'rgba(170, 15, 25, 0.2)', // Darker blood red with transparency
          borderColor: 'rgba(170, 15, 25, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(170, 15, 25, 1)',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const percentage = Math.round((value / totalUnits) * 100);
                return `Units: ${formatNumber(value)} (${percentage}%)`;
              }
            }
          },
          title: {
            display: true,
            text: 'Donation Weekday Distribution',
            font: {
              size: 16
            }
          }
        },
        scales: {
          r: {
            angleLines: {
              display: true
            },
            suggestedMin: 0
          }
        }
      }
    });
  }
  
  /**
   * Initialize chart toggle functionality for a table
   * @param {string} tableId - ID of the table element
   * @param {string} chartId - ID of the chart container
   * @param {string} canvasId - ID of the chart canvas
   * @param {Function} chartFunction - Function to create the chart
   * @param {Array} data - Data for the chart
   * @param {Object} additionalParams - Additional parameters for the chart function
   */
  function initializeChartToggle(tableId, chartId, canvasId, chartFunction, data, additionalParams = {}) {
    const table = document.getElementById(tableId);
    const chartContainer = document.getElementById(chartId);
    const toggleBtn = document.getElementById(`${tableId}-toggle`);
    let chart = null;
    
  toggleBtn.addEventListener('click', function() {
    const isExpanded = chartContainer.classList.contains('expanded');
    
    if (isExpanded) {
      // Collapse chart
      chartContainer.classList.remove('expanded');
      toggleBtn.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      // Expand chart
      chartContainer.classList.add('expanded');
      toggleBtn.classList.add('active');
      toggleBtn.setAttribute('aria-expanded', 'true');
      
      // Create chart if it doesn't exist
      if (!chart) {
        chart = chartFunction(data, canvasId, ...Object.values(additionalParams));
      }
    }
    });
    
    // Download functionality using SVG
    const downloadBtn = document.getElementById(`${chartId}-download`);
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function() {
        if (!chart) return;
        
        // Use the SVG export function from utils.js
        const filename = canvasId.replace(/-/g, '_');
        exportChartAsSVG(chart, filename);
      });
    }
  }
  
  /**
   * Setup toggle to expand/collapse all charts
   * @param {string} buttonId - ID of the expand all button
   * @param {Array} toggleBtnIds - Array of IDs of all toggle buttons
   */
  function setupExpandAllButton(buttonId, toggleBtnIds) {
    const expandAllBtn = document.getElementById(buttonId);
    let allExpanded = false;
    
    expandAllBtn.addEventListener('click', function() {
      allExpanded = !allExpanded;
      
      // Update button state
      if (allExpanded) {
        expandAllBtn.classList.add('active');
        expandAllBtn.textContent = 'Collapse All Charts';
      } else {
        expandAllBtn.classList.remove('active');
        expandAllBtn.textContent = 'Expand All Charts';
      }
      
      // Toggle all charts
      toggleBtnIds.forEach(id => {
        const toggleBtn = document.getElementById(id);
        const chartId = toggleBtn.getAttribute('data-target');
        const chartContainer = document.getElementById(chartId);
        const isCurrentlyExpanded = chartContainer.classList.contains('expanded');
        
        if (allExpanded !== isCurrentlyExpanded) {
          toggleBtn.click();
        }
      });
    });
  }
  
  /**
   * Generate HTML content for the descriptive statistics tab with charts
   * @param {Object} statsData - Object containing all the descriptive statistics data
   * @returns {string} HTML content for the descriptive statistics tab
   */
  function createDescriptiveStatsContent(statsData) {
    // Create an array to collect toggle button IDs for the expand all functionality
    const toggleBtnIds = [];
    // Process Patient sex distribution
    let patientSexHtml = '';
    let totalPatients = statsData.uniquePatientsCount;
    
    if (statsData.patientSexDistribution.length > 0) {
      // Redistribute 'U' values
      const processedSexData = redistributeUndefinedValues(
        statsData.patientSexDistribution, 
        'Patient_Sex', 
        'No_of_Patients'
      );
      
      processedSexData.forEach(row => {
        if (row.Patient_Sex && row.Patient_Sex !== 'Total') {
          const percent = (row.No_of_Patients / totalPatients * 100).toFixed(1);
          patientSexHtml += `
            <tr class="italic">
              <td>${row.Patient_Sex}</td>
              <td>${formatNumber(row.No_of_Patients)}</td>
              <td>${percent}%</td>
            </tr>
          `;
        }
      });
    }
    
    // Patient age statistics HTML
    let ageStatsHtml = '';
    if (statsData.patientAgeStats) {
      const stats = statsData.patientAgeStats;
      const meanAge = stats.Mean_Age ? Math.round(stats.Mean_Age) : '';
      const medianAge = stats.Median_Age || '';
      const q1Age = stats.Q1_Age || '';
      const q3Age = stats.Q3_Age || '';
      
      ageStatsHtml = `
        <tr class="italic">
          <td>Mean Age</td>
          <td colspan="2">${meanAge}</td>
        </tr>
        <tr class="italic">
          <td>Median Age (IQR)</td>
          <td colspan="2">${medianAge} (${q1Age} - ${q3Age})</td>
        </tr>
      `;
    }
    
    // Patient age groups HTML - Reorder and rename categories
    let ageGroupsHtml = '';
    if (statsData.patientAgeGroups.length > 0) {
      // Define the mapping for age group renaming
      const ageGroupMap = {
        '<20': '<20 years',
        '20-': '20-29 years',
        '30-': '30-39 years',
        '40-': '40-49 years',
        '50-': '50-59 years',
        '60-': '60-69 years',
        '70-': '70-79 years',
        '80+': '80 years or older'
      };
      
      // Define the custom sort order for age groups
      const ageGroupSortOrder = [
        '<20 years',
        '20-29 years',
        '30-39 years',
        '40-49 years',
        '50-59 years',
        '60-69 years',
        '70-79 years',
        '80 years or older'
      ];
      
      // Process the age groups data
      const processedAgeGroups = redistributeUndefinedValues(
        statsData.patientAgeGroups,
        'Age_Group',
        'COUNT'
      );
      
      // Rename the categories
      const renamedAgeGroups = renameCategories(
        processedAgeGroups,
        'Age_Group',
        ageGroupMap
      );
      
      // Sort by the custom order
      const sortedAgeGroups = sortByCustomOrder(
        renamedAgeGroups,
        'Age_Group',
        ageGroupSortOrder
      );
      
      // Generate the HTML
      sortedAgeGroups.forEach(row => {
        ageGroupsHtml += `
          <tr class="italic">
            <td>${row.Age_Group}</td>
            <td>${formatNumber(row.COUNT)}</td>
            <td>${formatPercent(row.PERCENT)}</td>
          </tr>
        `;
      });
    }
    
    // RBC units per patient HTML
    let rbcUnitsHtml = '';
    if (statsData.rbcUnitsPerPatient.length > 0) {
      // Process for any potential 'U' values
      const processedRbcUnits = redistributeUndefinedValues(
        statsData.rbcUnitsPerPatient,
        'Unit_Category',
        'COUNT'
      );
      
      processedRbcUnits.forEach(row => {
        rbcUnitsHtml += `
          <tr class="italic">
            <td>${row.Unit_Category}</td>
            <td>${formatNumber(row.COUNT)}</td>
            <td>${formatPercent(row.Relative_Frequency)}</td>
          </tr>
        `;
      });
    }
    
    // Donor hemoglobin distribution HTML - Reorder and rename categories
    let donorhbHtml = '';
    if (statsData.donorhbDistribution.length > 0) {
      const totalUnits = statsData.totalTransfusedUnits;
      
      // Define the mapping for hemoglobin category renaming
      const hbCategoryMap = {
        '>=170': '170 or higher'
      };
      
      // Define the custom sort order for hemoglobin categories
      const hbSortOrder = [
        '<125',
        '125-139',
        '140-154',
        '155-169',
        '170 or higher'
      ];
      
      // Process the hemoglobin data
      const processedHbData = redistributeUndefinedValues(
        statsData.donorhbDistribution,
        'donorhb_category',
        'No_of_Transfused_Units'
      );
      
      // Rename the categories
      const renamedHbData = renameCategories(
        processedHbData,
        'donorhb_category',
        hbCategoryMap
      );
      
      // Sort by the custom order
      const sortedHbData = sortByCustomOrder(
        renamedHbData,
        'donorhb_category',
        hbSortOrder
      );
      
      // Generate the HTML
      sortedHbData.forEach(row => {
        const percent = (row.No_of_Transfused_Units / totalUnits * 100).toFixed(1);
        donorhbHtml += `
          <tr class="italic">
            <td>${row.donorhb_category}</td>
            <td>${formatNumber(row.No_of_Transfused_Units)}</td>
            <td>${percent}%</td>
          </tr>
        `;
      });
    }
    
    // Storage distribution HTML - Reorder and rename categories
    let storageHtml = '';
    if (statsData.storageDistribution.length > 0) {
      const totalUnits = statsData.totalTransfusedUnits;
      
      // Define the mapping for storage category renaming
      const storageCategoryMap = {
        '<10': '<10 days',
        '10-19': '10-19 days',
        '20-29': '20-29 days',
        '30-39': '30-39 days',
        '>=40': '40 days or more'
      };
      
      // Define the custom sort order for storage categories
      const storageSortOrder = [
        '<10 days',
        '10-19 days',
        '20-29 days',
        '30-39 days',
        '40 days or more'
      ];
      
      // Process the storage data
      const processedStorageData = redistributeUndefinedValues(
        statsData.storageDistribution,
        'storagecat',
        'No_of_Transfused_Units'
      );
      
      // Rename the categories
      const renamedStorageData = renameCategories(
        processedStorageData,
        'storagecat',
        storageCategoryMap
      );
      
      // Sort by the custom order
      const sortedStorageData = sortByCustomOrder(
        renamedStorageData,
        'storagecat',
        storageSortOrder
      );
      
      // Generate the HTML
      sortedStorageData.forEach(row => {
        const percent = (row.No_of_Transfused_Units / totalUnits * 100).toFixed(1);
        storageHtml += `
          <tr class="italic">
            <td>${row.storagecat}</td>
            <td>${formatNumber(row.No_of_Transfused_Units)}</td>
            <td>${percent}%</td>
          </tr>
        `;
      });
    }
    
    // Donor sex distribution HTML
    let donorSexHtml = '';
    if (statsData.donorSexDistribution.length > 0) {
      const totalUnits = statsData.totalTransfusedUnits;
      
      // Process the donor sex data to redistribute 'U' values
      const processedDonorSexData = redistributeUndefinedValues(
        statsData.donorSexDistribution,
        'donor_sex_label',
        'No_of_Transfused_Units'
      );
      
      processedDonorSexData.forEach(row => {
        if (row.donor_sex_label && row.donor_sex_label !== 'Total') {
          const percent = (row.No_of_Transfused_Units / totalUnits * 100).toFixed(1);
          donorSexHtml += `
            <tr class="italic">
              <td>${row.donor_sex_label}</td>
              <td>${formatNumber(row.No_of_Transfused_Units)}</td>
              <td>${percent}%</td>
            </tr>
          `;
        }
      });
    }
    
    // Donor parity distribution HTML
    let donorParityHtml = '';
    if (statsData.donorParityDistribution.length > 0) {
      const totalUnits = statsData.totalTransfusedUnits;
      
      // Process the donor parity data to redistribute any 'U' values
      const processedDonorParityData = redistributeUndefinedValues(
        statsData.donorParityDistribution,
        'donor_parity_label',
        'No_of_Transfused_Units'
      );
      
      processedDonorParityData.forEach(row => {
        const label = row.donor_parity_label === 0 ? 'Nulliparous' : 'Parous';
        const percent = (row.No_of_Transfused_Units / totalUnits * 100).toFixed(1);
        donorParityHtml += `
          <tr class="italic">
            <td>${label}</td>
            <td>${formatNumber(row.No_of_Transfused_Units)}</td>
            <td>${percent}%</td>
          </tr>
        `;
      });
    }
    
    // Weekday distribution HTML
    let weekdayHtml = '';
    if (statsData.donationWeekdayDistribution.length > 0) {
      const totalUnits = statsData.totalTransfusedUnits;
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Process the weekday data to redistribute any 'U' values
      const processedWeekdayData = redistributeUndefinedValues(
        statsData.donationWeekdayDistribution,
        'wdy_donation',
        'No_of_Transfused_Units'
      );
      
      processedWeekdayData.forEach(row => {
        const dayIndex = row.wdy_donation - 1; // Adjust for 0-based array
        const dayName = days[dayIndex] || `Day ${row.wdy_donation}`;
        const percent = (row.No_of_Transfused_Units / totalUnits * 100).toFixed(1);
        
        weekdayHtml += `
          <tr class="italic">
            <td>${dayName}</td>
            <td>${formatNumber(row.No_of_Transfused_Units)}</td>
            <td>${percent}%</td>
          </tr>
        `;
      });
    }
    
    // Combine all HTML sections for the final output
    return `
      <div class="card">
        <div class="stats-table-header">
          <button id="expand-all-charts-btn" class="expand-all-btn">Expand All Charts</button>
        </div>
        
        <div class="stats-container">
          <div class="stats-column">
            <div class="stats-table-title">Table 1a. Characteristics of Transfused Patients</div>
            
            <!-- Patient Sex Table and Chart -->
            <div class="stats-table-header">
              <h3>Patient Sex Distribution</h3>
              <div class="chart-toggle">
                <button id="patient-sex-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="patient-sex-chart-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                </button>
              </div>
            </div>
            <table id="patient-sex-table" class="stats-table">
              <thead>
                <tr>
                  <th>Patient Sex</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${patientSexHtml}
                <tr class="total-row">
                  <td>Unique patients</td>
                  <td>${formatNumber(statsData.uniquePatientsCount)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="patient-sex-chart-container" class="stat-chart-container">
              <canvas id="patient-sex-chart"></canvas>
              <div class="chart-controls">
                <button id="patient-sex-chart-container-download" class="chart-download-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  SVG
                </button>
              </div>
            </div>
            
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Patient Age</th>
                  <th colspan="2"></th>
                </tr>
              </thead>
              <tbody>
                ${ageStatsHtml}
              </tbody>
            </table>
  
            <!-- Patient Age Distribution Table and Chart -->
            <div class="stats-table-header">
              <h3>Patient Age Distribution</h3>
              <div class="chart-toggle">
                <button id="patient-age-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="patient-age-chart-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                </button>
              </div>
            </div>
            <table id="patient-age-table" class="stats-table">
              <thead>
                <tr>
                  <th>Patient Age Distribution</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${ageGroupsHtml}
                <tr class="total-row">
                  <td>Unique patients</td>
                  <td>${formatNumber(statsData.uniquePatientsCount)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="patient-age-chart-container" class="stat-chart-container">
              <canvas id="patient-age-chart"></canvas>
              <div class="chart-controls">
                <button id="patient-age-chart-container-download" class="chart-download-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  SVG
                </button>
              </div>
            </div>
  
            <!-- RBC Units per Patient Table and Chart -->
            <div class="stats-table-header">
              <h3>RBC Units Received</h3>
              <div class="chart-toggle">
                <button id="rbc-units-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="rbc-units-chart-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                </button>
              </div>
            </div>
            <table id="rbc-units-table" class="stats-table">
              <thead>
                <tr>
                  <th>RBC units received</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${rbcUnitsHtml}
                <tr class="total-row">
                  <td>Unique patients</td>
                  <td>${formatNumber(statsData.uniquePatientsCount)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="rbc-units-chart-container" class="stat-chart-container">
              <canvas id="rbc-units-chart"></canvas>
              <div class="chart-controls">
                <button id="rbc-units-chart-container-download" class="chart-download-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  SVG
                </button>
              </div>
            </div>
          </div>
          
          <div class="stats-column">
            <div class="stats-table-title">Table 1b. Characteristics of Transfused Blood Components</div>
            
            <!-- Donor Hemoglobin Table and Chart -->
            <div class="stats-table-header">
              <h3>Donor Hemoglobin Distribution</h3>
              <div class="chart-toggle">
                <button id="donor-hb-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="donor-hb-chart-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                </button>
              </div>
            </div>
            <table id="donor-hb-table" class="stats-table">
              <thead>
                <tr>
                  <th>Donor Hemoglobin (g/L)</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${donorhbHtml}
                <tr class="total-row">
                  <td>Transfused RBC units</td>
                  <td>${formatNumber(statsData.totalTransfusedUnits)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="donor-hb-chart-container" class="stat-chart-container">
              <canvas id="donor-hb-chart"></canvas>
              <div class="chart-controls">
                <button id="donor-hb-chart-container-download" class="chart-download-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  SVG
                </button>
              </div>
            </div>
  
            <!-- Storage Distribution Table and Chart -->
            <div class="stats-table-header">
              <h3>RBC Storage Time Distribution</h3>
              <div class="chart-toggle">
                <button id="storage-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="storage-chart-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                </button>
              </div>
            </div>
            <table id="storage-table" class="stats-table">
              <thead>
                <tr>
                  <th>RBC Storage Time (days)</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${storageHtml}
                <tr class="total-row">
                  <td>Transfused RBC units</td>
                  <td>${formatNumber(statsData.totalTransfusedUnits)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="storage-chart-container" class="stat-chart-container">
              <canvas id="storage-chart"></canvas>
              <div class="chart-controls">
                <button id="storage-chart-container-download" class="chart-download-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  SVG
                </button>
              </div>
            </div>
  
            <!-- Donor Sex Table and Chart -->
            <div class="stats-table-header">
              <h3>Donor Sex Distribution</h3>
              <div class="chart-toggle">
                <button id="donor-sex-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="donor-sex-chart-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                </button>
              </div>
            </div>
            <table id="donor-sex-table" class="stats-table">
              <thead>
                <tr>
                  <th>Donor Sex</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${donorSexHtml}
                <tr class="total-row">
                  <td>Transfused RBC units</td>
                  <td>${formatNumber(statsData.totalTransfusedUnits)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="donor-sex-chart-container" class="stat-chart-container">
              <canvas id="donor-sex-chart"></canvas>
              <div class="chart-controls">
                <button id="donor-sex-chart-container-download" class="chart-download-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  SVG
                </button>
              </div>
            </div>
  
            <!-- Donor Parity Table and Chart -->
            <div class="stats-table-header">
              <h3>Donor Parity Distribution</h3>
              <div class="chart-toggle">
                <button id="donor-parity-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="donor-parity-chart-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                </button>
              </div>
            </div>
            <table id="donor-parity-table" class="stats-table">
              <thead>
                <tr>
                  <th>Donor Parity</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${donorParityHtml}
                <tr class="total-row">
                  <td>Transfused RBC units</td>
                  <td>${formatNumber(statsData.totalTransfusedUnits)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="donor-parity-chart-container" class="stat-chart-container">
              <canvas id="donor-parity-chart"></canvas>
              <div class="chart-controls">
                <button id="donor-parity-chart-container-download" class="chart-download-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  SVG
                </button>
              </div>
            </div>
  
            <!-- Weekday Distribution Table and Chart -->
            <div class="stats-table-header">
              <h3>Donation Weekday Distribution</h3>
              <div class="chart-toggle">
                <button id="weekday-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="weekday-chart-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                </button>
              </div>
            </div>
            <table id="weekday-table" class="stats-table">
              <thead>
                <tr>
                  <th>Weekday of donation</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${weekdayHtml}
                <tr class="total-row">
                  <td>Transfused RBC units</td>
                  <td>${formatNumber(statsData.totalTransfusedUnits)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="weekday-chart-container" class="stat-chart-container">
              <canvas id="weekday-chart"></canvas>
              <div class="chart-controls">
                <button id="weekday-chart-container-download" class="chart-download-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  SVG
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add all toggle button IDs for the expand all button functionality
    toggleBtnIds.push(
      'patient-sex-table-toggle',
      'patient-age-table-toggle',
      'rbc-units-table-toggle',
      'donor-hb-table-toggle',
      'storage-table-toggle',
      'donor-sex-table-toggle',
      'donor-parity-table-toggle',
      'weekday-table-toggle'
    );
    
    const html = `
      <div class="card">
        <div class="stats-table-header">
          <h2>Descriptive Statistics</h2>
          <button id="expand-all-charts-btn" class="expand-all-btn">Expand All Charts</button>
        </div>
        
        <div class="stats-container">
          <div class="stats-column">
            <div class="stats-table-title">Table 1a. Characteristics of Transfused Patients</div>
            
            <!-- Patient Sex Table and Chart -->
            <div class="stats-table-header">
              <h3>Patient Sex Distribution</h3>
              <div class="chart-toggle">
                <button id="patient-sex-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="patient-sex-chart-container">
                  <span class="chart-icon">📊</span>
                </button>
              </div>
            </div>
            <table id="patient-sex-table" class="stats-table">
              <thead>
                <tr>
                  <th>Patient Sex</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${patientSexHtml}
                <tr class="total-row">
                  <td>Unique patients</td>
                  <td>${formatNumber(statsData.uniquePatientsCount)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="patient-sex-chart-container" class="stat-chart-container">
              <canvas id="patient-sex-chart"></canvas>
              <div class="chart-controls">
                <button id="patient-sex-chart-container-download" class="chart-download-btn">Download Chart</button>
              </div>
            </div>
            
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Patient Age</th>
                  <th colspan="2"></th>
                </tr>
              </thead>
              <tbody>
                ${ageStatsHtml}
              </tbody>
            </table>
  
            <!-- Patient Age Distribution Table and Chart -->
            <div class="stats-table-header">
              <h3>Patient Age Distribution</h3>
              <div class="chart-toggle">
                <button id="patient-age-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="patient-age-chart-container">
                  <span class="chart-icon">📊</span>
                </button>
              </div>
            </div>
            <table id="patient-age-table" class="stats-table">
              <thead>
                <tr>
                  <th>Patient Age Distribution</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${ageGroupsHtml}
                <tr class="total-row">
                  <td>Unique patients</td>
                  <td>${formatNumber(statsData.uniquePatientsCount)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="patient-age-chart-container" class="stat-chart-container">
              <canvas id="patient-age-chart"></canvas>
              <div class="chart-controls">
                <button id="patient-age-chart-container-download" class="chart-download-btn">Download Chart</button>
              </div>
            </div>
  
            <!-- RBC Units per Patient Table and Chart -->
            <div class="stats-table-header">
              <h3>RBC Units Received</h3>
              <div class="chart-toggle">
                <button id="rbc-units-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="rbc-units-chart-container">
                  <span class="chart-icon">📊</span>
                </button>
              </div>
            </div>
            <table id="rbc-units-table" class="stats-table">
              <thead>
                <tr>
                  <th>RBC units received</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${rbcUnitsHtml}
                <tr class="total-row">
                  <td>Unique patients</td>
                  <td>${formatNumber(statsData.uniquePatientsCount)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="rbc-units-chart-container" class="stat-chart-container">
              <canvas id="rbc-units-chart"></canvas>
              <div class="chart-controls">
                <button id="rbc-units-chart-container-download" class="chart-download-btn">Download Chart</button>
              </div>
            </div>
          </div>
          
          <div class="stats-column">
            <div class="stats-table-title">Table 1b. Characteristics of Transfused Blood Components</div>
            
            <!-- Donor Hemoglobin Table and Chart -->
            <div class="stats-table-header">
              <h3>Donor Hemoglobin Distribution</h3>
              <div class="chart-toggle">
                <button id="donor-hb-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="donor-hb-chart-container">
                  <span class="chart-icon">📊</span>
                </button>
              </div>
            </div>
            <table id="donor-hb-table" class="stats-table">
              <thead>
                <tr>
                  <th>Donor Hemoglobin (g/L)</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${donorhbHtml}
                <tr class="total-row">
                  <td>Transfused RBC units</td>
                  <td>${formatNumber(statsData.totalTransfusedUnits)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="donor-hb-chart-container" class="stat-chart-container">
              <canvas id="donor-hb-chart"></canvas>
              <div class="chart-controls">
                <button id="donor-hb-chart-container-download" class="chart-download-btn">Download Chart</button>
              </div>
            </div>
  
            <!-- Storage Distribution Table and Chart -->
            <div class="stats-table-header">
              <h3>RBC Storage Time Distribution</h3>
              <div class="chart-toggle">
                <button id="storage-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="storage-chart-container">
                  <span class="chart-icon">📊</span>
                </button>
              </div>
            </div>
            <table id="storage-table" class="stats-table">
              <thead>
                <tr>
                  <th>RBC Storage Time (days)</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${storageHtml}
                <tr class="total-row">
                  <td>Transfused RBC units</td>
                  <td>${formatNumber(statsData.totalTransfusedUnits)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="storage-chart-container" class="stat-chart-container">
              <canvas id="storage-chart"></canvas>
              <div class="chart-controls">
                <button id="storage-chart-container-download" class="chart-download-btn">Download Chart</button>
              </div>
            </div>
  
            <!-- Donor Sex Table and Chart -->
            <div class="stats-table-header">
              <h3>Donor Sex Distribution</h3>
              <div class="chart-toggle">
                <button id="donor-sex-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="donor-sex-chart-container">
                  <span class="chart-icon">📊</span>
                </button>
              </div>
            </div>
            <table id="donor-sex-table" class="stats-table">
              <thead>
                <tr>
                  <th>Donor Sex</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${donorSexHtml}
                <tr class="total-row">
                  <td>Transfused RBC units</td>
                  <td>${formatNumber(statsData.totalTransfusedUnits)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="donor-sex-chart-container" class="stat-chart-container">
              <canvas id="donor-sex-chart"></canvas>
              <div class="chart-controls">
                <button id="donor-sex-chart-container-download" class="chart-download-btn">Download Chart</button>
              </div>
            </div>
  
            <!-- Donor Parity Table and Chart -->
            <div class="stats-table-header">
              <h3>Donor Parity Distribution</h3>
              <div class="chart-toggle">
                <button id="donor-parity-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="donor-parity-chart-container">
                  <span class="chart-icon">📊</span>
                </button>
              </div>
            </div>
            <table id="donor-parity-table" class="stats-table">
              <thead>
                <tr>
                  <th>Donor Parity</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${donorParityHtml}
                <tr class="total-row">
                  <td>Transfused RBC units</td>
                  <td>${formatNumber(statsData.totalTransfusedUnits)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="donor-parity-chart-container" class="stat-chart-container">
              <canvas id="donor-parity-chart"></canvas>
              <div class="chart-controls">
                <button id="donor-parity-chart-container-download" class="chart-download-btn">Download Chart</button>
              </div>
            </div>
  
            <!-- Weekday Distribution Table and Chart -->
            <div class="stats-table-header">
              <h3>Donation Weekday Distribution</h3>
              <div class="chart-toggle">
                <button id="weekday-table-toggle" class="chart-toggle-btn" aria-expanded="false" data-target="weekday-chart-container">
                  <span class="chart-icon">📊</span>
                </button>
              </div>
            </div>
            <table id="weekday-table" class="stats-table">
              <thead>
                <tr>
                  <th>Weekday of donation</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                ${weekdayHtml}
                <tr class="total-row">
                  <td>Transfused RBC units</td>
                  <td>${formatNumber(statsData.totalTransfusedUnits)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
            <div id="weekday-chart-container" class="stat-chart-container">
              <canvas id="weekday-chart"></canvas>
              <div class="chart-controls">
                <button id="weekday-chart-container-download" class="chart-download-btn">Download Chart</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }

  /**
   * Initialize all chart toggles and the expand all button
   * @param {Object} statsData - Object containing all the descriptive statistics data
   */
  function initializeDescriptiveStatsCharts(statsData) {
    const totalUnits = statsData.totalTransfusedUnits;
    
    // Initialize each chart toggle
    initializeChartToggle('patient-sex-table', 'patient-sex-chart-container', 'patient-sex-chart', 
                         createPatientSexChart, statsData.patientSexDistribution);
    
    initializeChartToggle('patient-age-table', 'patient-age-chart-container', 'patient-age-chart', 
                         createPatientAgeGroupsChart, statsData.patientAgeGroups);
    
    initializeChartToggle('rbc-units-table', 'rbc-units-chart-container', 'rbc-units-chart', 
                         createRbcUnitsChart, statsData.rbcUnitsPerPatient);
    
    initializeChartToggle('donor-hb-table', 'donor-hb-chart-container', 'donor-hb-chart', 
                         createDonorHbChart, statsData.donorhbDistribution, { totalUnits });
    
    initializeChartToggle('storage-table', 'storage-chart-container', 'storage-chart', 
                         createStorageChart, statsData.storageDistribution, { totalUnits });
    
    initializeChartToggle('donor-sex-table', 'donor-sex-chart-container', 'donor-sex-chart', 
                         createDonorSexChart, statsData.donorSexDistribution, { totalUnits });
    
    initializeChartToggle('donor-parity-table', 'donor-parity-chart-container', 'donor-parity-chart', 
                         createDonorParityChart, statsData.donorParityDistribution, { totalUnits });
    
    initializeChartToggle('weekday-table', 'weekday-chart-container', 'weekday-chart', 
                         createWeekdayChart, statsData.donationWeekdayDistribution, { totalUnits });
    
    // Initialize the expand all button
    const toggleBtnIds = [
      'patient-sex-table-toggle',
      'patient-age-table-toggle',
      'rbc-units-table-toggle',
      'donor-hb-table-toggle',
      'storage-table-toggle',
      'donor-sex-table-toggle',
      'donor-parity-table-toggle',
      'weekday-table-toggle'
    ];
    
    setupExpandAllButton('expand-all-charts-btn', toggleBtnIds);
  }
