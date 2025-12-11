import { useEffect, useState, useMemo, useCallback } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { loadDescriptiveStatistics } from '@/services/dataService'
import { useAsyncData } from '@/hooks/useCSVData'
import { BaseChart } from '@/components/charts'
import type { ChartData, ChartOptions } from 'chart.js'
import styles from './DescriptiveStatistics.module.css'

// Chart toggle icon
function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 16V12M12 16V8M16 16V10" />
    </svg>
  )
}

export function DescriptiveStatisticsTab() {
  const { setLoading, setError } = useDashboardStore()
  const [expandedCharts, setExpandedCharts] = useState<Set<string>>(new Set())
  const [allExpanded, setAllExpanded] = useState(false)

  const { data: stats, loading, error } = useAsyncData(
    loadDescriptiveStatistics,
    []
  )

  useEffect(() => {
    setLoading(loading)
    if (error) setError(error.message)
  }, [loading, error, setLoading, setError])

  const toggleChart = useCallback((chartId: string) => {
    setExpandedCharts(prev => {
      const next = new Set(prev)
      if (next.has(chartId)) {
        next.delete(chartId)
      } else {
        next.add(chartId)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    const allChartIds = [
      'patient-sex', 'patient-age', 'rbc-units',
      'donor-hb', 'storage', 'weekday', 'donor-sex', 'donor-parity'
    ]
    if (allExpanded) {
      setExpandedCharts(new Set())
    } else {
      setExpandedCharts(new Set(allChartIds))
    }
    setAllExpanded(!allExpanded)
  }, [allExpanded])

  // Prepare chart configurations
  const chartConfigs = useMemo(() => {
    if (!stats) return null

    // Color scheme matching legacy dashboard
    const bloodRed = 'rgba(170, 15, 25, 0.8)'
    const darkBlue = 'rgba(25, 80, 150, 0.8)'

    return {
      patientSex: {
        data: {
          labels: stats.patientSex.map(d => d.sex),
          datasets: [{
            data: stats.patientSex.map(d => d.count),
            backgroundColor: [bloodRed, darkBlue],
            borderWidth: 1,
            borderColor: ['rgba(170, 15, 25, 1)', 'rgba(25, 80, 150, 1)'],
          }],
        } as ChartData<'pie'>,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' },
          },
        } as ChartOptions<'pie'>,
      },
      patientAge: {
        data: {
          labels: stats.ageGroups.map(g => g.ageGroup),
          datasets: [{
            label: 'Number of Patients',
            data: stats.ageGroups.map(g => g.count),
            backgroundColor: bloodRed,
            borderColor: 'rgba(170, 15, 25, 1)',
            borderWidth: 1,
          }],
        } as ChartData<'bar'>,
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'Number of Patients' } },
          },
        } as ChartOptions<'bar'>,
      },
      rbcUnits: {
        data: {
          labels: stats.rbcUnitsPerPatient.map(u => String(u.unitsReceived)),
          datasets: [{
            label: 'Number of Patients',
            data: stats.rbcUnitsPerPatient.map(u => u.count),
            backgroundColor: bloodRed,
            borderColor: 'rgba(170, 15, 25, 1)',
            borderWidth: 1,
          }],
        } as ChartData<'bar'>,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'Number of RBC Units' } },
            y: { title: { display: true, text: 'Number of Patients' }, beginAtZero: true },
          },
        } as ChartOptions<'bar'>,
      },
      donorHb: {
        data: {
          labels: stats.donorHb.map(d => d.category),
          datasets: [{
            label: 'Number of Units',
            data: stats.donorHb.map(d => d.count),
            backgroundColor: bloodRed,
            borderColor: 'rgba(170, 15, 25, 1)',
            borderWidth: 1,
          }],
        } as ChartData<'bar'>,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'Hemoglobin (g/L)' } },
            y: { title: { display: true, text: 'Number of RBC Units' }, beginAtZero: true },
          },
        } as ChartOptions<'bar'>,
      },
      storage: {
        data: {
          labels: stats.storage.map(s => s.category),
          datasets: [{
            label: 'Number of Units',
            data: stats.storage.map(s => s.count),
            backgroundColor: bloodRed,
            borderColor: 'rgba(170, 15, 25, 1)',
            borderWidth: 1,
          }],
        } as ChartData<'bar'>,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'Storage Time' } },
            y: { title: { display: true, text: 'Number of RBC Units' }, beginAtZero: true },
          },
        } as ChartOptions<'bar'>,
      },
      donorSex: {
        data: {
          labels: stats.donorSex.map(d => d.sex),
          datasets: [{
            data: stats.donorSex.map(d => d.count),
            backgroundColor: [bloodRed, darkBlue],
            borderWidth: 1,
            borderColor: ['rgba(170, 15, 25, 1)', 'rgba(25, 80, 150, 1)'],
          }],
        } as ChartData<'pie'>,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' },
          },
        } as ChartOptions<'pie'>,
      },
      donorParity: {
        data: {
          labels: stats.donorParity.map(d => d.parity === 'Nulliparous' || d.parity === '0' ? 'Nulliparous' : 'Parous'),
          datasets: [{
            data: stats.donorParity.map(d => d.count),
            backgroundColor: [darkBlue, bloodRed],
            borderWidth: 1,
            borderColor: ['rgba(25, 80, 150, 1)', 'rgba(170, 15, 25, 1)'],
          }],
        } as ChartData<'pie'>,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' },
          },
        } as ChartOptions<'pie'>,
      },
      weekday: {
        data: {
          // Order: Monday through Sunday
          labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          datasets: [{
            label: 'Number of Units',
            // Sort data: Monday(2) through Saturday(7), then Sunday(1)
            data: [...stats.donationWeekday].sort((a, b) => {
              const orderA = a.dayNumber === 1 ? 8 : a.dayNumber
              const orderB = b.dayNumber === 1 ? 8 : b.dayNumber
              return orderA - orderB
            }).map(d => d.count),
            backgroundColor: bloodRed,
            borderColor: 'rgba(170, 15, 25, 1)',
            borderWidth: 1,
          }],
        } as ChartData<'bar'>,
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'Number of Units' } },
          },
        } as ChartOptions<'bar'>,
      },
    }
  }, [stats])

  if (loading) {
    return <div className={styles.loading}>Loading descriptive statistics...</div>
  }

  if (!stats) {
    return <div className={styles.error}>Failed to load statistics</div>
  }

  const formatNumber = (n: number) => n.toLocaleString()
  const formatPercent = (n: number, total: number) => ((n / total) * 100).toFixed(1) + '%'

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <section className={styles.header}>
        <h2 className={styles.pageTitle}>Study Population</h2>
        <p className={styles.pageDescription}>
          Before examining transfusion effects, it's important to understand who was studied and what blood
          products they received. This section describes the {formatNumber(stats.uniquePatients)} unique ICU patients
          and {formatNumber(stats.totalUnits)} RBC transfusions in our analysis.
        </p>
      </section>

      {/* Guide Box */}
      <section className={styles.guideBox}>
        <div className={styles.guideContent}>
          <div className={styles.guideText}>
            <h3>Understanding This Data</h3>
            <p>
              <strong>Table 1a</strong> (left) describes the patients: demographics and transfusion counts.{' '}
              <strong>Table 1b</strong> (right) describes the blood products: donor traits and storage time.{' '}
              Click the chart icon (<ChartIcon />) on any row to visualize that data.
            </p>
          </div>
          <button
            className={`${styles.expandAllBtn} ${allExpanded ? styles.active : ''}`}
            onClick={toggleAll}
          >
            {allExpanded ? 'Collapse All Charts' : 'Expand All Charts'}
          </button>
        </div>
      </section>

      {/* Two-column layout matching legacy */}
      <div className={styles.twoColumnLayout}>
        {/* Left Column - Table 1a: Patient Characteristics */}
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Table 1a. Characteristics of Transfused Patients</h3>

          {/* Patient Sex Distribution */}
          <div className={styles.statBlock}>
            <div className={styles.statHeader}>
              <h4 className={styles.statTitle}>Patient Sex Distribution</h4>
              <button
                className={`${styles.chartToggleBtn} ${expandedCharts.has('patient-sex') ? styles.active : ''}`}
                onClick={() => toggleChart('patient-sex')}
                aria-expanded={expandedCharts.has('patient-sex')}
              >
                <ChartIcon />
              </button>
            </div>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Patient Sex</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                {stats.patientSex.map(row => (
                  <tr key={row.sex}>
                    <td>{row.sex}</td>
                    <td className={styles.numCell}>{formatNumber(row.count)}</td>
                    <td className={styles.numCell}>{row.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td>Unique patients</td>
                  <td className={styles.numCell}>{formatNumber(stats.uniquePatients)}</td>
                  <td className={styles.numCell}>100.0%</td>
                </tr>
              </tbody>
            </table>
            {expandedCharts.has('patient-sex') && chartConfigs && (
              <div className={styles.chartContainer}>
                <BaseChart type="pie" data={chartConfigs.patientSex.data} options={chartConfigs.patientSex.options} height={200} showVerticalLine={false} />
              </div>
            )}
          </div>

          {/* Patient Age Distribution */}
          <div className={styles.statBlock}>
            <div className={styles.statHeader}>
              <h4 className={styles.statTitle}>Patient Age Distribution</h4>
              <button
                className={`${styles.chartToggleBtn} ${expandedCharts.has('patient-age') ? styles.active : ''}`}
                onClick={() => toggleChart('patient-age')}
                aria-expanded={expandedCharts.has('patient-age')}
              >
                <ChartIcon />
              </button>
            </div>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Age Group</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                {stats.ageGroups.map(row => (
                  <tr key={row.ageGroup}>
                    <td>{row.ageGroup}</td>
                    <td className={styles.numCell}>{formatNumber(row.count)}</td>
                    <td className={styles.numCell}>{row.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td>Unique patients</td>
                  <td className={styles.numCell}>{formatNumber(stats.uniquePatients)}</td>
                  <td className={styles.numCell}>100.0%</td>
                </tr>
                <tr className={styles.summaryRow}>
                  <td>Mean Age</td>
                  <td className={styles.numCell}>{Math.round(stats.patientAge.mean)}</td>
                  <td></td>
                </tr>
                <tr className={styles.summaryRow}>
                  <td>Median Age (IQR)</td>
                  <td className={styles.numCell}>{stats.patientAge.median} ({stats.patientAge.q1} – {stats.patientAge.q3})</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            {expandedCharts.has('patient-age') && chartConfigs && (
              <div className={styles.chartContainer}>
                <BaseChart type="bar" data={chartConfigs.patientAge.data} options={chartConfigs.patientAge.options} height={280} showVerticalLine={false} />
              </div>
            )}
          </div>

          {/* RBC Units Received */}
          <div className={styles.statBlock}>
            <div className={styles.statHeader}>
              <h4 className={styles.statTitle}>RBC Units Received</h4>
              <button
                className={`${styles.chartToggleBtn} ${expandedCharts.has('rbc-units') ? styles.active : ''}`}
                onClick={() => toggleChart('rbc-units')}
                aria-expanded={expandedCharts.has('rbc-units')}
              >
                <ChartIcon />
              </button>
            </div>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>RBC Units Received</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                {stats.rbcUnitsPerPatient.map(row => (
                  <tr key={row.unitsReceived}>
                    <td>{row.unitsReceived}</td>
                    <td className={styles.numCell}>{formatNumber(row.count)}</td>
                    <td className={styles.numCell}>{row.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td>Unique patients</td>
                  <td className={styles.numCell}>{formatNumber(stats.uniquePatients)}</td>
                  <td className={styles.numCell}>100.0%</td>
                </tr>
              </tbody>
            </table>
            {expandedCharts.has('rbc-units') && chartConfigs && (
              <div className={styles.chartContainer}>
                <BaseChart type="bar" data={chartConfigs.rbcUnits.data} options={chartConfigs.rbcUnits.options} height={250} showVerticalLine={false} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Table 1b: Blood Component Characteristics */}
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Table 1b. Characteristics of Transfused Blood Components</h3>

          {/* Donor Hemoglobin Distribution */}
          <div className={styles.statBlock}>
            <div className={styles.statHeader}>
              <h4 className={styles.statTitle}>Donor Hemoglobin Distribution</h4>
              <button
                className={`${styles.chartToggleBtn} ${expandedCharts.has('donor-hb') ? styles.active : ''}`}
                onClick={() => toggleChart('donor-hb')}
                aria-expanded={expandedCharts.has('donor-hb')}
              >
                <ChartIcon />
              </button>
            </div>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Donor Hemoglobin (g/L)</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                {stats.donorHb.map(row => (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td className={styles.numCell}>{formatNumber(row.count)}</td>
                    <td className={styles.numCell}>{formatPercent(row.count, stats.totalUnits)}</td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td>Transfused RBC units</td>
                  <td className={styles.numCell}>{formatNumber(stats.totalUnits)}</td>
                  <td className={styles.numCell}>100.0%</td>
                </tr>
              </tbody>
            </table>
            {expandedCharts.has('donor-hb') && chartConfigs && (
              <div className={styles.chartContainer}>
                <BaseChart type="bar" data={chartConfigs.donorHb.data} options={chartConfigs.donorHb.options} height={250} showVerticalLine={false} />
              </div>
            )}
          </div>

          {/* Storage Time Distribution */}
          <div className={styles.statBlock}>
            <div className={styles.statHeader}>
              <h4 className={styles.statTitle}>RBC Storage Time Distribution</h4>
              <button
                className={`${styles.chartToggleBtn} ${expandedCharts.has('storage') ? styles.active : ''}`}
                onClick={() => toggleChart('storage')}
                aria-expanded={expandedCharts.has('storage')}
              >
                <ChartIcon />
              </button>
            </div>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>RBC Storage Time (days)</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                {stats.storage.map(row => (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td className={styles.numCell}>{formatNumber(row.count)}</td>
                    <td className={styles.numCell}>{formatPercent(row.count, stats.totalUnits)}</td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td>Transfused RBC units</td>
                  <td className={styles.numCell}>{formatNumber(stats.totalUnits)}</td>
                  <td className={styles.numCell}>100.0%</td>
                </tr>
              </tbody>
            </table>
            {expandedCharts.has('storage') && chartConfigs && (
              <div className={styles.chartContainer}>
                <BaseChart type="bar" data={chartConfigs.storage.data} options={chartConfigs.storage.options} height={250} showVerticalLine={false} />
              </div>
            )}
          </div>

          {/* Weekday Distribution */}
          <div className={styles.statBlock}>
            <div className={styles.statHeader}>
              <h4 className={styles.statTitle}>Donation Weekday Distribution</h4>
              <button
                className={`${styles.chartToggleBtn} ${expandedCharts.has('weekday') ? styles.active : ''}`}
                onClick={() => toggleChart('weekday')}
                aria-expanded={expandedCharts.has('weekday')}
              >
                <ChartIcon />
              </button>
            </div>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Weekday of Donation</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                {/* Order: Monday through Sunday */}
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  // Map day names to day numbers: Monday=2, Tuesday=3, ..., Saturday=7, Sunday=1
                  const dayNumMap: Record<string, number> = {
                    'Monday': 2, 'Tuesday': 3, 'Wednesday': 4, 'Thursday': 5,
                    'Friday': 6, 'Saturday': 7, 'Sunday': 1
                  }
                  const dayNum = dayNumMap[day]
                  const row = stats.donationWeekday.find(d => d.dayNumber === dayNum || d.weekday === day) || { count: 0 }
                  return (
                    <tr key={day}>
                      <td>{day}</td>
                      <td className={styles.numCell}>{formatNumber(row.count)}</td>
                      <td className={styles.numCell}>{formatPercent(row.count, stats.totalUnits)}</td>
                    </tr>
                  )
                })}
                <tr className={styles.totalRow}>
                  <td>Transfused RBC units</td>
                  <td className={styles.numCell}>{formatNumber(stats.totalUnits)}</td>
                  <td className={styles.numCell}>100.0%</td>
                </tr>
              </tbody>
            </table>
            {expandedCharts.has('weekday') && chartConfigs && (
              <div className={styles.chartContainer}>
                <BaseChart type="bar" data={chartConfigs.weekday.data} options={chartConfigs.weekday.options} height={280} showVerticalLine={false} />
              </div>
            )}
          </div>

          {/* Donor Sex Distribution */}
          <div className={styles.statBlock}>
            <div className={styles.statHeader}>
              <h4 className={styles.statTitle}>Donor Sex Distribution</h4>
              <button
                className={`${styles.chartToggleBtn} ${expandedCharts.has('donor-sex') ? styles.active : ''}`}
                onClick={() => toggleChart('donor-sex')}
                aria-expanded={expandedCharts.has('donor-sex')}
              >
                <ChartIcon />
              </button>
            </div>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Donor Sex</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                {stats.donorSex.map(row => (
                  <tr key={row.sex}>
                    <td>{row.sex}</td>
                    <td className={styles.numCell}>{formatNumber(row.count)}</td>
                    <td className={styles.numCell}>{formatPercent(row.count, stats.totalUnits)}</td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td>Transfused RBC units</td>
                  <td className={styles.numCell}>{formatNumber(stats.totalUnits)}</td>
                  <td className={styles.numCell}>100.0%</td>
                </tr>
              </tbody>
            </table>
            {expandedCharts.has('donor-sex') && chartConfigs && (
              <div className={styles.chartContainer}>
                <BaseChart type="pie" data={chartConfigs.donorSex.data} options={chartConfigs.donorSex.options} height={200} showVerticalLine={false} />
              </div>
            )}
          </div>

          {/* Donor Parity Distribution */}
          <div className={styles.statBlock}>
            <div className={styles.statHeader}>
              <h4 className={styles.statTitle}>Donor Parity Distribution</h4>
              <button
                className={`${styles.chartToggleBtn} ${expandedCharts.has('donor-parity') ? styles.active : ''}`}
                onClick={() => toggleChart('donor-parity')}
                aria-expanded={expandedCharts.has('donor-parity')}
              >
                <ChartIcon />
              </button>
            </div>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Donor Parity</th>
                  <th>Frequency</th>
                  <th>Relative Frequency</th>
                </tr>
              </thead>
              <tbody>
                {stats.donorParity.map(row => (
                  <tr key={row.parity}>
                    <td>{row.parity === 'Nulliparous' || row.parity === '0' ? 'Nulliparous' : 'Parous'}</td>
                    <td className={styles.numCell}>{formatNumber(row.count)}</td>
                    <td className={styles.numCell}>{formatPercent(row.count, stats.totalUnits)}</td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td>Transfused RBC units</td>
                  <td className={styles.numCell}>{formatNumber(stats.totalUnits)}</td>
                  <td className={styles.numCell}>100.0%</td>
                </tr>
              </tbody>
            </table>
            {expandedCharts.has('donor-parity') && chartConfigs && (
              <div className={styles.chartContainer}>
                <BaseChart type="pie" data={chartConfigs.donorParity.data} options={chartConfigs.donorParity.options} height={200} showVerticalLine={false} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
