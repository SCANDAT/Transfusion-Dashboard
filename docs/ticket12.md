# T-012: Descriptive Statistics Tab

| Field | Value |
|-------|-------|
| **ID** | T-012 |
| **Title** | Descriptive Statistics Tab |
| **Phase** | 5 - Tab Implementations |
| **Priority** | High |
| **Depends On** | T-004, T-006, T-007 |
| **Blocks** | T-013 |
| **Estimated Effort** | 4-5 hours |

---

## Objective

Implement the Descriptive Statistics tab showing patient demographics, transfusion characteristics, and donor/RBC component distributions with charts and summary tables.

---

## Context

This tab in the legacy application shows:
- Patient statistics (count, sex distribution, age)
- RBC units per patient distribution
- Donor characteristics (hemoglobin, sex, parity)
- Storage time distribution
- Donation weekday distribution

This is `descriptiveStats.js` (2,167 lines) in the legacy codebase—the largest module.

---

## Requirements

### 1. Tab Container

**`src/components/tabs/DescriptiveStatistics/index.tsx`:**

```typescript
import { useEffect } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { loadDescriptiveStatistics } from '@/services/dataService'
import { useAsyncData } from '@/hooks/useCSVData'
import { PatientStats } from './PatientStats'
import { DonorStats } from './DonorStats'
import { StorageStats } from './StorageStats'
import styles from './DescriptiveStatistics.module.css'

export function DescriptiveStatisticsTab() {
  const { setLoading, setError } = useDashboardStore()
  
  const { data: stats, loading, error } = useAsyncData(
    loadDescriptiveStatistics,
    []
  )
  
  useEffect(() => {
    setLoading(loading)
    if (error) setError(error.message)
  }, [loading, error, setLoading, setError])
  
  if (loading) {
    return <div className={styles.loading}>Loading descriptive statistics...</div>
  }
  
  if (!stats) {
    return <div className={styles.error}>Failed to load statistics</div>
  }
  
  return (
    <div className={styles.container}>
      {/* Summary Cards */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Patients</span>
          <span className={styles.summaryValue}>
            {stats.uniquePatients.toLocaleString()}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total RBC Units</span>
          <span className={styles.summaryValue}>
            {stats.totalUnits.toLocaleString()}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Avg Units/Patient</span>
          <span className={styles.summaryValue}>
            {(stats.totalUnits / stats.uniquePatients).toFixed(1)}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Study Period</span>
          <span className={styles.summaryValue}>2014–2018</span>
        </div>
      </div>
      
      {/* Patient Statistics Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Patient Demographics</h2>
        <PatientStats
          sexDistribution={stats.patientSex}
          ageStats={stats.patientAge}
          ageGroups={stats.ageGroups}
          rbcUnitsPerPatient={stats.rbcUnitsPerPatient}
        />
      </section>
      
      {/* Donor Statistics Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Donor & RBC Characteristics</h2>
        <DonorStats
          donorHb={stats.donorHb}
          donorSex={stats.donorSex}
          donorParity={stats.donorParity}
          donationWeekday={stats.donationWeekday}
        />
      </section>
      
      {/* Storage Statistics Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>RBC Storage</h2>
        <StorageStats storage={stats.storage} />
      </section>
    </div>
  )
}
```

### 2. Patient Statistics Component

**`src/components/tabs/DescriptiveStatistics/PatientStats.tsx`:**

```typescript
import { BaseChart } from '@/components/charts'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import type { ChartData, ChartOptions } from 'chart.js'
import type { 
  PatientSexDistribution, 
  PatientAgeStats, 
  AgeGroupDistribution,
  RbcUnitsPerPatient 
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
```

### 3. Donor Statistics Component

**`src/components/tabs/DescriptiveStatistics/DonorStats.tsx`:**

```typescript
import { BaseChart } from '@/components/charts'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import type { ChartData, ChartOptions } from 'chart.js'
import type { 
  DonorHbDistribution, 
  DonorSexDistribution, 
  DonorParityDistribution,
  DonationWeekdayDistribution 
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
```

### 4. Storage Statistics Component

**`src/components/tabs/DescriptiveStatistics/StorageStats.tsx`:**

```typescript
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
```

### 5. Styles

**`src/components/tabs/DescriptiveStatistics/DescriptiveStatistics.module.css`:**

```css
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
  max-width: var(--container-xl);
  margin: 0 auto;
}

.loading,
.error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--color-text-muted);
  font-size: var(--text-lg);
}

.error {
  color: var(--color-error);
}

/* Summary Row */
.summaryRow {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-4);
}

.summaryCard {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-4);
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border-left: 4px solid var(--color-accent-primary);
}

.summaryLabel {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.summaryValue {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

/* Section */
.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.sectionTitle {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

/* Stats Grid */
.statsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-4);
}

.statCard {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.statCardWide {
  grid-column: span 2;
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

.statCardFull {
  grid-column: 1 / -1;
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.cardTitle {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

/* Charts */
.chartSmall {
  height: 180px;
}

.chartMedium {
  height: 250px;
}

.chartLarge {
  height: 300px;
}

/* Stats Table */
.statsTable {
  width: 100%;
  font-size: var(--text-sm);
  border-collapse: collapse;
}

.statsTable th,
.statsTable td {
  padding: var(--spacing-2) var(--spacing-3);
  text-align: left;
  border-bottom: 1px solid var(--color-border-subtle);
}

.statsTable th {
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.statsTable td:first-child {
  color: var(--color-text-secondary);
}

.statsTable td:last-child {
  color: var(--color-text-primary);
  font-weight: var(--font-medium);
  text-align: right;
}

@media (max-width: 768px) {
  .statCardWide {
    grid-column: span 1;
  }
  
  .statsGrid {
    grid-template-columns: 1fr;
  }
}
```

### 6. Index Export

**`src/components/tabs/DescriptiveStatistics/index.ts`:**

```typescript
export { DescriptiveStatisticsTab } from './index'
```

---

## Acceptance Criteria

- [ ] Summary cards show correct totals (patients, units, avg)
- [ ] Patient age statistics table displays correctly
- [ ] Sex distribution pie chart renders with legend
- [ ] Age group bar chart renders correctly
- [ ] RBC units per patient bar chart renders
- [ ] Donor Hb distribution bar chart renders
- [ ] Donor sex/parity pie charts render
- [ ] Weekday distribution bar chart renders
- [ ] Storage time bar chart and table render
- [ ] All charts responsive to container size
- [ ] Loading state shows while data fetches
- [ ] Numbers formatted with locale separators

---

## Notes for Agent

1. **Multiple CSVs**: `loadDescriptiveStatistics` loads ~11 CSV files in parallel. Already implemented in T-004.

2. **Chart Types**: Mix of doughnut (pie), bar, and tables. No line charts in this tab.

3. **Vertical Line**: Set `showVerticalLine={false}` for all charts in this tab (no t=0 concept here).

4. **Grid Layout**: `grid-column: span 2` creates wider cards for bar charts.

5. **Data Validation**: Handle missing/null values gracefully—some distributions may have gaps.