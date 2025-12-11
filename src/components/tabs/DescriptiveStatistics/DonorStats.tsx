import { BaseChart } from '@/components/charts'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import type { ChartData, ChartOptions } from 'chart.js'
import type {
  DonorHbDistribution,
  DonorSexDistribution,
  DonorParityDistribution,
  DonationWeekdayDistribution,
} from '@/types'
import styles from './DescriptiveStatistics.module.css'

interface DonorStatsProps {
  donorHb: DonorHbDistribution[]
  donorSex: DonorSexDistribution[]
  donorParity: DonorParityDistribution[]
  donationWeekday: DonationWeekdayDistribution[]
}

export function DonorStats({
  donorHb,
  donorSex,
  donorParity,
  donationWeekday,
}: DonorStatsProps) {
  // Donor Hb bar chart
  const hbChartData: ChartData<'bar'> = {
    labels: donorHb.map(d => d.category),
    datasets: [{
      label: 'Units',
      data: donorHb.map(d => d.count),
      backgroundColor: CHART_COLORS[1],
    }],
  }

  const hbChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Donor Hemoglobin Distribution',
      },
    },
    scales: {
      x: { title: { display: true, text: 'Hemoglobin Category' } },
      y: { title: { display: true, text: 'Number of Units' }, beginAtZero: true },
    },
  }

  // Donor sex pie chart
  const sexChartData: ChartData<'doughnut'> = {
    labels: donorSex.map(d => d.sex),
    datasets: [{
      data: donorSex.map(d => d.count),
      backgroundColor: [CHART_COLORS[0], CHART_COLORS[3]],
      borderWidth: 0,
    }],
  }

  const pieOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  }

  // Donor parity pie chart
  const parityChartData: ChartData<'doughnut'> = {
    labels: donorParity.map(d => d.parity),
    datasets: [{
      data: donorParity.map(d => d.count),
      backgroundColor: [CHART_COLORS[2], CHART_COLORS[5]],
      borderWidth: 0,
    }],
  }

  // Donation weekday bar chart
  const weekdayChartData: ChartData<'bar'> = {
    labels: donationWeekday.map(d => d.weekday),
    datasets: [{
      label: 'Units',
      data: donationWeekday.map(d => d.count),
      backgroundColor: CHART_COLORS[4],
    }],
  }

  const weekdayChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Donation by Weekday',
      },
    },
    scales: {
      x: { title: { display: true, text: 'Day of Week' } },
      y: { title: { display: true, text: 'Number of Units' }, beginAtZero: true },
    },
  }

  return (
    <div className={styles.statsGrid}>
      {/* Donor Hemoglobin Distribution */}
      <div className={styles.statCardWide}>
        <div className={styles.chartMedium}>
          <BaseChart
            type="bar"
            data={hbChartData}
            options={hbChartOptions}
            height={250}
            showVerticalLine={false}
          />
        </div>
      </div>

      {/* Donor Sex */}
      <div className={styles.statCard}>
        <h3 className={styles.cardTitle}>Donor Sex</h3>
        <div className={styles.chartSmall}>
          <BaseChart
            type="doughnut"
            data={sexChartData}
            options={pieOptions}
            height={180}
            showVerticalLine={false}
          />
        </div>
        <table className={styles.statsTable}>
          <tbody>
            {donorSex.map(d => (
              <tr key={d.sex}>
                <td>{d.sex}</td>
                <td>{d.count.toLocaleString()} ({d.percentage.toFixed(1)}%)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Donor Parity */}
      <div className={styles.statCard}>
        <h3 className={styles.cardTitle}>Female Donor Parity</h3>
        <div className={styles.chartSmall}>
          <BaseChart
            type="doughnut"
            data={parityChartData}
            options={pieOptions}
            height={180}
            showVerticalLine={false}
          />
        </div>
        <table className={styles.statsTable}>
          <tbody>
            {donorParity.map(d => (
              <tr key={d.parity}>
                <td>{d.parity}</td>
                <td>{d.count.toLocaleString()} ({d.percentage.toFixed(1)}%)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Donation Weekday */}
      <div className={styles.statCardWide}>
        <div className={styles.chartMedium}>
          <BaseChart
            type="bar"
            data={weekdayChartData}
            options={weekdayChartOptions}
            height={250}
            showVerticalLine={false}
          />
        </div>
      </div>
    </div>
  )
}
