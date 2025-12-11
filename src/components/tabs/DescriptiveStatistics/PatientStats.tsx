import { BaseChart } from '@/components/charts'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import type { ChartData, ChartOptions } from 'chart.js'
import type {
  PatientSexDistribution,
  PatientAgeStats,
  AgeGroupDistribution,
  RbcUnitsPerPatient,
} from '@/types'
import styles from './DescriptiveStatistics.module.css'

interface PatientStatsProps {
  sexDistribution: PatientSexDistribution[]
  ageStats: PatientAgeStats
  ageGroups: AgeGroupDistribution[]
  rbcUnitsPerPatient: RbcUnitsPerPatient[]
}

export function PatientStats({
  sexDistribution,
  ageStats,
  ageGroups,
  rbcUnitsPerPatient,
}: PatientStatsProps) {
  // Sex distribution pie chart
  const sexChartData: ChartData<'doughnut'> = {
    labels: sexDistribution.map(d => d.sex),
    datasets: [{
      data: sexDistribution.map(d => d.count),
      backgroundColor: [CHART_COLORS[0], CHART_COLORS[1]],
      borderWidth: 0,
    }],
  }

  const sexChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Patient Sex Distribution',
      },
    },
  }

  // Age distribution bar chart
  const ageChartData: ChartData<'bar'> = {
    labels: ageGroups.map(g => g.ageGroup),
    datasets: [{
      label: 'Patients',
      data: ageGroups.map(g => g.count),
      backgroundColor: CHART_COLORS[2],
    }],
  }

  const ageChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Patient Age Distribution',
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Age Group' },
      },
      y: {
        title: { display: true, text: 'Number of Patients' },
        beginAtZero: true,
      },
    },
  }

  // RBC units per patient bar chart
  const unitsChartData: ChartData<'bar'> = {
    labels: rbcUnitsPerPatient.map(u => String(u.unitsReceived)),
    datasets: [{
      label: 'Patients',
      data: rbcUnitsPerPatient.map(u => u.count),
      backgroundColor: CHART_COLORS[4],
    }],
  }

  const unitsChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'RBC Units Received per Patient',
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Units Received' },
      },
      y: {
        title: { display: true, text: 'Number of Patients' },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className={styles.statsGrid}>
      {/* Age Summary Table */}
      <div className={styles.statCard}>
        <h3 className={styles.cardTitle}>Age Statistics</h3>
        <table className={styles.statsTable}>
          <tbody>
            <tr>
              <td>Mean (SD)</td>
              <td>{ageStats.mean.toFixed(1)} ({ageStats.sd.toFixed(1)})</td>
            </tr>
            <tr>
              <td>Median</td>
              <td>{ageStats.median.toFixed(1)}</td>
            </tr>
            <tr>
              <td>IQR</td>
              <td>{ageStats.q1.toFixed(1)} – {ageStats.q3.toFixed(1)}</td>
            </tr>
            <tr>
              <td>Range</td>
              <td>{ageStats.min} – {ageStats.max}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sex Distribution Chart */}
      <div className={styles.statCard}>
        <div className={styles.chartSmall}>
          <BaseChart
            type="doughnut"
            data={sexChartData}
            options={sexChartOptions}
            height={200}
            showVerticalLine={false}
          />
        </div>
        <table className={styles.statsTable}>
          <tbody>
            {sexDistribution.map(d => (
              <tr key={d.sex}>
                <td>{d.sex}</td>
                <td>{d.count.toLocaleString()} ({d.percentage.toFixed(1)}%)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Age Distribution Chart */}
      <div className={styles.statCardWide}>
        <div className={styles.chartMedium}>
          <BaseChart
            type="bar"
            data={ageChartData}
            options={ageChartOptions}
            height={250}
            showVerticalLine={false}
          />
        </div>
      </div>

      {/* RBC Units per Patient Chart */}
      <div className={styles.statCardWide}>
        <div className={styles.chartMedium}>
          <BaseChart
            type="bar"
            data={unitsChartData}
            options={unitsChartOptions}
            height={250}
            showVerticalLine={false}
          />
        </div>
      </div>
    </div>
  )
}
