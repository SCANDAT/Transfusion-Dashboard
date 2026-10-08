import { useMemo } from 'react'
import type { ModelVitalSummaryRow, VitalSummaryRow } from '@/types'
import { CHART_COLORS } from '@/hooks/useChartTheme'
import { buildSummaryChangePanels, formatChangeValue } from './summaryChangePanels'
import styles from './MainFindings.module.css'

const PLOT_LEFT = 112
const PLOT_RIGHT = 260
const POINT_COLORS = [CHART_COLORS[2], CHART_COLORS[0], CHART_COLORS[1]]

export function ModelSummaryChart({ modelData, observedData }: {
  modelData: ModelVitalSummaryRow[]
  observedData: VitalSummaryRow[]
}) {
  const panels = useMemo(() => buildSummaryChangePanels(modelData, observedData), [modelData, observedData])

  return (
    <>
      <p className={styles.changePanelNote}>
        Points show estimates only. Confidence intervals for these changes remain under review
        and are not shown. Axis ranges differ between panels; each uses its outcome's own units.
      </p>
      <div className={styles.changePanels}>
        {panels.map(panel => {
          const x = (value: number) => PLOT_LEFT +
            ((value - panel.minimum) / (panel.maximum - panel.minimum)) * (PLOT_RIGHT - PLOT_LEFT)
          const description = panel.points.map(point =>
            `${point.label}: ${point.value === null ? 'not available' : `${point.value} ${panel.unit}`}`
          ).join('; ')

          return (
            <article key={panel.code} className={styles.changePanel} aria-label={panel.name}>
              <h3 className={styles.changePanelTitle}>{panel.name}</h3>
              <svg
                viewBox="0 0 340 176"
                className={styles.changePanelSvg}
                role="img"
                aria-label={`${panel.shortName}: change from -1 to +1 hour (${panel.unit}). ${description}`}
              >
                <line x1={x(0)} x2={x(0)} y1="18" y2="115" className={styles.changeZeroLine} />
                {panel.points.map((point, index) => {
                  const y = 30 + index * 34
                  return (
                    <g key={point.label}>
                      <text x="2" y={y + 4} className={styles.changeRowLabel}>{point.label}</text>
                      {point.value !== null && (
                        <circle
                          cx={x(point.value)} cy={y} r="5"
                          fill={POINT_COLORS[index]}
                          data-estimate={point.value}
                          aria-label={`${point.label}: ${point.value} ${panel.unit}`}
                        />
                      )}
                      <text x="334" y={y + 4} textAnchor="end" className={styles.changeValue}>
                        {point.value === null ? '—' : formatChangeValue(point.value)}
                      </text>
                    </g>
                  )
                })}
                <line x1={PLOT_LEFT} x2={PLOT_RIGHT} y1="122" y2="122" className={styles.changeAxisLine} />
                {panel.ticks.map(tick => (
                  <g key={tick}>
                    <line x1={x(tick)} x2={x(tick)} y1="122" y2="127" className={styles.changeAxisLine} />
                    <text x={x(tick)} y="141" textAnchor="middle" className={styles.changeTick}>
                      {formatChangeValue(tick)}
                    </text>
                  </g>
                ))}
                <text x={(PLOT_LEFT + PLOT_RIGHT) / 2} y="166" textAnchor="middle" className={styles.changeAxisLabel}>
                  Change ({panel.unit})
                </text>
              </svg>
            </article>
          )
        })}
      </div>
    </>
  )
}
