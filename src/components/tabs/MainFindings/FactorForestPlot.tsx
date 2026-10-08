import { getFactorCategoryLabel } from '@/utils/factorLabels'
import { isFiniteNumber } from '@/components/charts/formatChartEstimate'
import { formatChangeValue } from './summaryChangePanels'
import { useMemo } from 'react'
import type { FactorObservedSummaryRow, FactorModelSummaryRow } from '@/types'
import { VITAL_PARAMS, VITAL_PARAM_CODES, COMP_FACTOR_CODES } from '@/types'
import { BaseChart } from '@/components/charts'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import type { ChartData, ChartOptions } from 'chart.js'
import styles from './MainFindings.module.css'
import { FactorSummaryNotes } from './FactorSummaryNotes'

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
  observed?: number
  baseModel?: number
  fullModel?: number
}

export function FactorForestPlot({
  factorCode,
  factorName,
  observedData,
  modelData,
  showObserved = true,
  showBaseModel = false,
  showFullModel = true,
}: FactorForestPlotProps) {
  const vitalPlots = useMemo(() => {
    return VITAL_PARAM_CODES.map(vitalCode => {
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
          label: getFactorCategoryLabel(factorCode, cat),
          observed: obs?.Diff_Mean,
          baseModel: mod?.Base_Diff,
          fullModel: mod?.Full_Diff,
        }
      })

      return {
        vitalCode,
        vitalName: VITAL_PARAMS[vitalCode].shortName,
        unit: VITAL_PARAMS[vitalCode].unit === '%' ? 'percentage points' : VITAL_PARAMS[vitalCode].unit,
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
        <div className={styles.forestPlotTitleCell}>{factorName}</div>
        {vitalPlots.map(plot => plot && (
          <ForestPlotChart
            key={plot.vitalCode}
            vitalName={plot.vitalName}
            unit={plot.unit}
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
  unit: string
  categoryData: CategoryData[]
  showObserved: boolean
  showBaseModel: boolean
  showFullModel: boolean
}

function ForestPlotChart({ vitalName, unit, categoryData, showObserved, showBaseModel, showFullModel }: ForestPlotChartProps) {
  const series = [
    { visible: showObserved, label: 'Observed', key: 'observed', color: CHART_COLORS[2], pointStyle: 'circle' },
    { visible: showBaseModel, label: 'No-interaction model (base)', key: 'baseModel', color: CHART_COLORS[0], pointStyle: 'triangle' },
    { visible: showFullModel, label: 'No-interaction model (fully adjusted)', key: 'fullModel', color: CHART_COLORS[1], pointStyle: 'rectRot' },
  ] as const

  const datasets: ChartData<'line'>['datasets'] = series.filter(item => item.visible).map(item => ({
    label: item.label,
    data: categoryData.map(category => isFiniteNumber(category[item.key]) ? category[item.key]! : null),
    backgroundColor: item.color,
    borderColor: item.color,
    pointStyle: item.pointStyle,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointHitRadius: 10,
    showLine: false,
    spanGaps: false,
  }))

  // Hidden series and legacy confidence limits must never determine the axis.
  const values = datasets.flatMap(dataset => dataset.data).filter(isFiniteNumber)
  const minimum = Math.min(0, ...values)
  const maximum = Math.max(0, ...values)
  const padding = (maximum - minimum || 1) * 0.15
  const chartData: ChartData<'line'> = {
    labels: categoryData.map(category => category.label),
    datasets,
  }

  const zeroLinePlugin = {
    id: 'zeroLine',
    beforeDatasetsDraw(chart: import('chart.js').Chart) {
      const { ctx, scales, chartArea } = chart
      const yScale = scales.y
      if (!yScale) return
      const yZero = yScale.getPixelForValue(0)
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

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: vitalName,
        font: { size: 12, weight: 'bold' },
        padding: { bottom: 8 },
      },
      tooltip: {
        callbacks: {
          label: context => {
            const value = context.dataset.data[context.dataIndex]
            return `${context.dataset.label}: ${isFiniteNumber(value) ? `${formatChangeValue(value)} ${unit}` : 'unavailable'}`
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        min: minimum - padding,
        max: maximum + padding,
        title: { display: true, text: `Change (${unit})` },
        grid: { color: 'rgba(128, 128, 128, 0.1)' },
      },
    },
  }

  const summary = datasets.map(dataset =>
    `${dataset.label}: ${categoryData.map((category, index) => {
      const value = dataset.data[index]
      return `${category.label} ${isFiniteNumber(value) ? `${value} ${unit}` : 'unavailable'}`
    }).join(', ')}`
  ).join('; ')

  return (
    <div className={styles.forestPlotChart} role="img" aria-label={`${vitalName} within-category changes. ${summary}`}>
      {datasets.length === 0 ? <p>Select estimates to display.</p> : (
        <BaseChart
          type="line"
          data={chartData}
          options={chartOptions}
          height={220}
          plugins={[zeroLinePlugin]}
        />
      )}
    </div>
  )
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
  const factors = useMemo(() => {
    const factorSet = new Set<string>()
    observedData.forEach(r => factorSet.add(r.FactorName))
    modelData.forEach(r => factorSet.add(r.FactorName))
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
      <FactorSummaryNotes />
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
