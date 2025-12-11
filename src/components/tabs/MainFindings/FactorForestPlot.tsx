import { useMemo } from 'react'
import type { FactorObservedSummaryRow, FactorModelSummaryRow } from '@/types'
import { VITAL_PARAMS, VITAL_PARAM_CODES, COMP_FACTOR_CODES } from '@/types'
import { BaseChart } from '@/components/charts'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import type { ChartData, ChartOptions } from 'chart.js'
import styles from './MainFindings.module.css'

interface FactorForestPlotProps {
  factorCode: string
  factorName: string
  observedData: FactorObservedSummaryRow[]
  modelData: FactorModelSummaryRow[]
  showObserved?: boolean
  showBaseModel?: boolean
  showFullModel?: boolean
}

interface CategoryData {
  category: string
  label: string
  observed?: { mean: number; lower: number; upper: number }
  baseModel?: { mean: number; lower: number; upper: number }
  fullModel?: { mean: number; lower: number; upper: number }
}

/**
 * Forest plot for a single component factor
 * Shows effect estimates with confidence intervals for each category
 */
export function FactorForestPlot({
  factorCode,
  factorName,
  observedData,
  modelData,
  showObserved = true,
  showBaseModel = false,
  showFullModel = true,
}: FactorForestPlotProps) {
  // Get data for each vital parameter
  const vitalPlots = useMemo(() => {
    return VITAL_PARAM_CODES.map(vitalCode => {
      // Filter data for this vital and factor (allow '0' as valid category)
      const obsForVital = observedData.filter(
        row => row.Abbreviation === vitalCode &&
               row.FactorName === factorCode &&
               row.FactorCategory !== undefined && row.FactorCategory !== null && row.FactorCategory !== '' && row.FactorCategory !== '.'
      )
      const modelForVital = modelData.filter(
        row => row.Abbreviation === vitalCode &&
               row.FactorName === factorCode &&
               row.FactorCategory !== undefined && row.FactorCategory !== null && row.FactorCategory !== '' && row.FactorCategory !== '.'
      )

      if (obsForVital.length === 0 && modelForVital.length === 0) {
        return null
      }

      // Get all categories
      // For weekdays, use Monday-Sunday order (2,3,4,5,6,7,1)
      const categories = [...new Set([
        ...obsForVital.map(r => r.FactorCategory),
        ...modelForVital.map(r => r.FactorCategory),
      ])].sort((a, b) => {
        const numA = parseFloat(String(a))
        const numB = parseFloat(String(b))
        if (!isNaN(numA) && !isNaN(numB)) {
          if (factorCode === 'wdy_donation') {
            const orderA = numA === 1 ? 8 : numA // Sunday becomes 8 (last)
            const orderB = numB === 1 ? 8 : numB
            return orderA - orderB
          }
          return numA - numB
        }
        return String(a).localeCompare(String(b))
      })

      const categoryData: CategoryData[] = categories.map(cat => {
        const obs = obsForVital.find(r => r.FactorCategory === cat)
        const mod = modelForVital.find(r => r.FactorCategory === cat)

        return {
          category: cat,
          label: getCategoryLabel(factorCode, cat),
          observed: obs ? {
            mean: obs.Diff_Mean,
            lower: obs.Diff_LCL,
            upper: obs.Diff_UCL,
          } : undefined,
          baseModel: mod ? {
            mean: mod.Base_Diff,
            lower: mod.Base_Diff_LCL,
            upper: mod.Base_Diff_UCL,
          } : undefined,
          fullModel: mod ? {
            mean: mod.Full_Diff,
            lower: mod.Full_Diff_LCL,
            upper: mod.Full_Diff_UCL,
          } : undefined,
        }
      })

      return {
        vitalCode,
        vitalName: VITAL_PARAMS[vitalCode]?.shortName || vitalCode,
        categoryData,
      }
    }).filter(Boolean)
  }, [observedData, modelData, factorCode])

  if (vitalPlots.length === 0) {
    return null
  }

  return (
    <div className={styles.forestPlotContainer}>
      <div className={styles.forestPlotGrid}>
        {/* 4x2 grid: Title + 7 charts (MAP, SBP, DBP, HR, SpO2, Temp, FIO2) */}
        <div className={styles.forestPlotTitleCell}>{factorName}</div>
        {vitalPlots.map(plot => plot && (
          <ForestPlotChart
            key={plot.vitalCode}
            vitalName={plot.vitalName}
            categoryData={plot.categoryData}
            showObserved={showObserved}
            showBaseModel={showBaseModel}
            showFullModel={showFullModel}
          />
        ))}
      </div>
    </div>
  )
}

interface ForestPlotChartProps {
  vitalName: string
  categoryData: CategoryData[]
  showObserved: boolean
  showBaseModel: boolean
  showFullModel: boolean
}

function ForestPlotChart({ vitalName, categoryData, showObserved, showBaseModel, showFullModel }: ForestPlotChartProps) {
  // Store error bar data
  const errorBars = useMemo(() => ({
    observed: categoryData.map(d => d.observed || { lower: 0, upper: 0, mean: 0 }),
    baseModel: categoryData.map(d => d.baseModel || { lower: 0, upper: 0, mean: 0 }),
    fullModel: categoryData.map(d => d.fullModel || { lower: 0, upper: 0, mean: 0 }),
  }), [categoryData])

  // Calculate y-axis range to include all CIs
  const allValues = [
    ...errorBars.observed.flatMap(e => [e.lower, e.upper]),
    ...errorBars.baseModel.flatMap(e => [e.lower, e.upper]),
    ...errorBars.fullModel.flatMap(e => [e.lower, e.upper]),
  ].filter(v => v !== 0)

  const minY = allValues.length > 0 ? Math.min(...allValues) : -5
  const maxY = allValues.length > 0 ? Math.max(...allValues) : 5
  const padding = (maxY - minY) * 0.15

  const datasets: ChartData<'bar'>['datasets'] = []

  if (showObserved) {
    datasets.push({
      label: 'Observed',
      data: categoryData.map(d => d.observed?.mean ?? null),
      backgroundColor: CHART_COLORS[2] + '90',
      borderColor: CHART_COLORS[2],
      borderWidth: 1,
      borderRadius: 2,
      barPercentage: 0.6,
      categoryPercentage: 0.85,
    })
  }

  if (showBaseModel) {
    datasets.push({
      label: 'Base',
      data: categoryData.map(d => d.baseModel?.mean ?? null),
      backgroundColor: CHART_COLORS[0] + '90',
      borderColor: CHART_COLORS[0],
      borderWidth: 1,
      borderRadius: 2,
      barPercentage: 0.6,
      categoryPercentage: 0.85,
    })
  }

  if (showFullModel) {
    datasets.push({
      label: 'Full',
      data: categoryData.map(d => d.fullModel?.mean ?? null),
      backgroundColor: CHART_COLORS[1] + '90',
      borderColor: CHART_COLORS[1],
      borderWidth: 1,
      borderRadius: 2,
      barPercentage: 0.6,
      categoryPercentage: 0.85,
    })
  }

  const chartData: ChartData<'bar'> = {
    labels: categoryData.map(d => d.label),
    datasets,
  }

  // Custom plugin for vertical error bars
  const errorBarPlugin = {
    id: 'verticalErrorBars',
    afterDatasetsDraw(chart: import('chart.js').Chart) {
      const { ctx, scales } = chart
      const yScale = scales.y
      if (!yScale) return

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex)
        if (meta.hidden) return

        // Select appropriate error data based on dataset label
        let errors: typeof errorBars.observed
        if (dataset.label === 'Observed') {
          errors = errorBars.observed
        } else if (dataset.label === 'Base') {
          errors = errorBars.baseModel
        } else {
          errors = errorBars.fullModel
        }
        const color = dataset.borderColor as string

        meta.data.forEach((bar, index) => {
          const error = errors[index]
          if (!error || (error.lower === 0 && error.upper === 0)) return

          const x = bar.x
          const yTop = yScale.getPixelForValue(error.upper)
          const yBottom = yScale.getPixelForValue(error.lower)
          const capWidth = 3

          ctx.save()
          ctx.strokeStyle = color
          ctx.lineWidth = 1.5

          // Vertical line
          ctx.beginPath()
          ctx.moveTo(x, yTop)
          ctx.lineTo(x, yBottom)
          ctx.stroke()

          // Top cap
          ctx.beginPath()
          ctx.moveTo(x - capWidth, yTop)
          ctx.lineTo(x + capWidth, yTop)
          ctx.stroke()

          // Bottom cap
          ctx.beginPath()
          ctx.moveTo(x - capWidth, yBottom)
          ctx.lineTo(x + capWidth, yBottom)
          ctx.stroke()

          ctx.restore()
        })
      })
    },
  }

  // Plugin to draw horizontal zero line
  const zeroLinePlugin = {
    id: 'zeroLine',
    beforeDatasetsDraw(chart: import('chart.js').Chart) {
      const { ctx, scales, chartArea } = chart
      const yScale = scales.y
      if (!yScale) return

      const yZero = yScale.getPixelForValue(0)
      if (yZero < chartArea.top || yZero > chartArea.bottom) return

      ctx.save()
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])

      ctx.beginPath()
      ctx.moveTo(chartArea.left, yZero)
      ctx.lineTo(chartArea.right, yZero)
      ctx.stroke()

      ctx.restore()
    },
  }

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: vitalName,
        font: { size: 12, weight: 'bold' },
        padding: { bottom: 8 },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const idx = context.dataIndex
            const catData = categoryData[idx]
            if (!catData) return ''
            let data: typeof catData.observed
            if (context.dataset.label === 'Observed') {
              data = catData.observed
            } else if (context.dataset.label === 'Base') {
              data = catData.baseModel
            } else {
              data = catData.fullModel
            }
            if (!data) return ''
            return `${context.dataset.label}: ${data.mean.toFixed(2)} [${data.lower.toFixed(2)}, ${data.upper.toFixed(2)}]`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        min: minY - padding,
        max: maxY + padding,
        title: {
          display: false,
        },
        grid: {
          color: 'rgba(128, 128, 128, 0.1)',
        },
      },
    },
  }

  const chartHeight = 200

  return (
    <div className={styles.forestPlotChart}>
      <BaseChart
        type="bar"
        data={chartData}
        options={chartOptions}
        height={chartHeight}
        plugins={[errorBarPlugin, zeroLinePlugin]}
      />
    </div>
  )
}

/**
 * Get human-readable category label
 */
function getCategoryLabel(factorCode: string, category: string | number): string {
  const catStr = String(category)
  const categoryLabels: Record<string, Record<string, string>> = {
    DonorHb_Cat: {
      '1': '<125 g/L',
      '2': '125-139',
      '3': '140-154',
      '4': '155-169',
      '5': '≥170 g/L',
    },
    Storage_Cat: {
      '1': '<10d',
      '2': '10-19d',
      '3': '20-29d',
      '4': '30-39d',
      '5': '≥40d',
    },
    wdy_donation: {
      '1': 'Sun',
      '2': 'Mon',
      '3': 'Tue',
      '4': 'Wed',
      '5': 'Thu',
      '6': 'Fri',
      '7': 'Sat',
    },
    DonorSex: {
      'Male': 'Male',
      'Female': 'Female',
      'M': 'Male',
      'F': 'Female',
      '1': 'Male',
      '2': 'Female',
    },
    DonorParity: {
      'Nulliparous': 'Nullip.',
      'Parous': 'Parous',
      '0': 'Nullip.',
      '1': 'Parous',
    },
  }

  return categoryLabels[factorCode]?.[catStr] || catStr
}

/**
 * Combined forest plots for all factors
 */
interface AllFactorForestPlotsProps {
  observedData: FactorObservedSummaryRow[]
  modelData: FactorModelSummaryRow[]
  showObserved?: boolean
  showBaseModel?: boolean
  showFullModel?: boolean
}

export function AllFactorForestPlots({
  observedData,
  modelData,
  showObserved = true,
  showBaseModel = false,
  showFullModel = true,
}: AllFactorForestPlotsProps) {
  // Get factors that have data, in standard order from COMP_FACTOR_CODES
  const factors = useMemo(() => {
    const factorSet = new Set<string>()
    observedData.forEach(r => factorSet.add(r.FactorName))
    modelData.forEach(r => factorSet.add(r.FactorName))
    // Return factors in COMP_FACTOR_CODES order, filtering to only those with data
    return COMP_FACTOR_CODES.filter(code => factorSet.has(code))
  }, [observedData, modelData])

  const factorNames: Record<string, string> = {
    DonorHb_Cat: 'Donor Hemoglobin',
    Storage_Cat: 'Storage Time',
    DonorSex: 'Donor Sex',
    DonorParity: 'Donor Parity',
    wdy_donation: 'Donation Weekday',
  }

  return (
    <div className={styles.allForestPlots}>
      {factors.map(factor => (
        <FactorForestPlot
          key={factor}
          factorCode={factor}
          factorName={factorNames[factor] || factor}
          observedData={observedData}
          modelData={modelData}
          showObserved={showObserved}
          showBaseModel={showBaseModel}
          showFullModel={showFullModel}
        />
      ))}
    </div>
  )
}
