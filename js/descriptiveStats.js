/**
 * Descriptive statistics functionality for the Transfusion Dashboard
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
   * Generate HTML content for the descriptive statistics tab
   * @param {Object} statsData - Object containing all the descriptive statistics data
   * @returns {string} HTML content for the descriptive statistics tab
   */
  function createDescriptiveStatsContent(statsData) {
    // Patient sex distribution HTML
    let patientSexHtml = '';
    let totalPatients = statsData.uniquePatientsCount;
    
    if (statsData.patientSexDistribution.length > 0) {
      statsData.patientSexDistribution.forEach(row => {
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
    
    // Patient age groups HTML
    let ageGroupsHtml = '';
    if (statsData.patientAgeGroups.length > 0) {
      statsData.patientAgeGroups.forEach(row => {
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
      statsData.rbcUnitsPerPatient.forEach(row => {
        rbcUnitsHtml += `
          <tr class="italic">
            <td>${row.Unit_Category}</td>
            <td>${formatNumber(row.COUNT)}</td>
            <td>${formatPercent(row.Relative_Frequency)}</td>
          </tr>
        `;
      });
    }
    
    // Donor hemoglobin distribution HTML
    let donorhbHtml = '';
    if (statsData.donorhbDistribution.length > 0) {
      const totalUnits = statsData.totalTransfusedUnits;
      statsData.donorhbDistribution.forEach(row => {
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
    
    // Storage distribution HTML
    let storageHtml = '';
    if (statsData.storageDistribution.length > 0) {
      const totalUnits = statsData.totalTransfusedUnits;
      statsData.storageDistribution.forEach(row => {
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
      statsData.donorSexDistribution.forEach(row => {
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
      statsData.donorParityDistribution.forEach(row => {
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
      
      statsData.donationWeekdayDistribution.forEach(row => {
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
        <div class="stats-container">
          <div class="stats-column">
            <div class="stats-table-title">Table 1a. Characteristics of Transfused Patients</div>
            <table class="stats-table">
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
  
            <table class="stats-table">
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
  
            <table class="stats-table">
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
          </div>
          
          <div class="stats-column">
            <div class="stats-table-title">Table 1b. Characteristics of Transfused Blood Components</div>
            <table class="stats-table">
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
  
            <table class="stats-table">
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
  
            <table class="stats-table">
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
  
            <table class="stats-table">
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
  
            <table class="stats-table">
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
          </div>
        </div>
      </div>
    `;
  }