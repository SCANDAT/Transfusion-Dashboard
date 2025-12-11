import { BaseChart } from '@/components/charts'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import type { ChartData, ChartOptions } from 'chart.js'
import type { StorageDistribution } from '@/types'
import styles from './DescriptiveStatistics.module.css'

interface StorageStatsProps {
  storage: StorageDistribution[]
}

export function StorageStats({ storage }: StorageStatsProps) {
  const chartData: ChartData<'bar'> = {
    labels: storage.map(s => s.category),
    datasets: [{
      label: 'Units',
      data: storage.map(s => s.count),
      backgroundColor: CHART_COLORS[6],
    }],
  }

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'RBC Storage Time Distribution',
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Storage Duration' },
      },
      y: {
        title: { display: true, text: 'Number of Units' },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCardFull}>
        <div className={styles.chartLarge}>
          <BaseChart
            type="bar"
            data={chartData}
            options={chartOptions}
            height={300}
            showVerticalLine={false}
          />
        </div>
        <table className={styles.statsTable}>
          <thead>
            <tr>
              <th>Storage Duration</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {storage.map(s => (
              <tr key={s.category}>
                <td>{s.category}</td>
                <td>{s.count.toLocaleString()}</td>
                <td>{s.percentage.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
