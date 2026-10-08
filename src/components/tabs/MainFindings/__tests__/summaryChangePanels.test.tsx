import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { ModelVitalSummaryRow, VitalSummaryRow } from '@/types'
import { buildSummaryChangePanels } from '../summaryChangePanels'
import { ModelSummaryChart } from '../ModelSummaryChart'

const model = (values: Partial<ModelVitalSummaryRow>) => values as ModelVitalSummaryRow
const observed = (values: Partial<VitalSummaryRow>) => values as VitalSummaryRow

afterEach(cleanup)

describe('outcome-specific pre/post estimate panels', () => {
  it('separates measurement units without standardising or rescaling values', () => {
    const panels = buildSummaryChangePanels([
      model({ Abbreviation: 'ARTm', Base_Diff: 100, Full_Diff: 80 }),
      model({ Abbreviation: 'VE', Base_Diff: 0.01, Full_Diff: 0.008 }),
      model({ Abbreviation: 'SPO2', Full_Diff: 0.25 }),
      model({ Abbreviation: 'FIO2', Full_Diff: -0.75 }),
    ], [])
    expect(panels).toHaveLength(7)
    const pressure = panels.find(panel => panel.code === 'ARTm')!
    const ventilation = panels.find(panel => panel.code === 'VE')!
    expect(pressure.unit).toBe('mmHg')
    expect(ventilation.unit).toBe('L/min')
    expect(pressure.maximum).toBeGreaterThan(ventilation.maximum * 1000)
    expect(pressure.points[2]?.value).toBe(80)
    expect(ventilation.points[2]?.value).toBe(0.008)
    expect(panels.find(panel => panel.code === 'SPO2')).toMatchObject({
      unit: 'percentage points', points: [{}, {}, { value: 0.25 }],
    })
    expect(panels.find(panel => panel.code === 'FIO2')?.points[2]?.value).toBe(-0.75)
    expect(panels.find(panel => panel.code === 'HR')?.unit).toBe('bpm')
  })

  it('excludes uncertainty fields from geometry while placing unchanged signed estimates and zero correctly', () => {
    const models = [model({
      Abbreviation: 'ARTm', Base_Diff: 0, Full_Diff: 2,
      Base_Diff_LCL: -9999, Base_Diff_UCL: 9999,
      Full_Diff_LCL: -8888, Full_Diff_UCL: 8888,
    })]
    const observations = [observed({ Abbreviation: 'ARTm', Diff_Mean: -2, Diff_LCL: -7777, Diff_UCL: 7777 })]
    const panel = buildSummaryChangePanels(models, observations)[0]!
    expect(panel.minimum).toBe(-2)
    expect(panel.maximum).toBe(2)
    render(<ModelSummaryChart modelData={models} observedData={observations} />)
    const plot = within(screen.getByRole('article', { name: 'Mean Arterial Pressure' })).getByRole('img')
    const circles = Array.from(plot.querySelectorAll('circle'))
    expect(circles.map(circle => circle.getAttribute('data-estimate'))).toEqual(['-2', '0', '2'])
    expect(circles.map(circle => circle.getAttribute('cx'))).toEqual(['112', '186', '260'])
    expect(plot.getAttribute('aria-label')).toContain('Base model: 0 mmHg')
    expect(plot.getAttribute('aria-label')).not.toContain('9999')
    expect(plot.querySelectorAll('path, rect, polyline')).toHaveLength(0)
  })

  it('does not turn missing or non-finite values into zeros, and retains observed-only outcomes', () => {
    const models = [model({ Abbreviation: 'HR', Base_Diff: Number.NaN, Full_Diff: Number.POSITIVE_INFINITY })]
    const observations = [observed({ Abbreviation: 'VE', Diff_Mean: 0 })]
    const panels = buildSummaryChangePanels(models, observations)
    expect(panels.find(panel => panel.code === 'HR')?.points.every(point => point.value === null)).toBe(true)
    expect(panels.find(panel => panel.code === 'VE')?.points.map(point => point.value)).toEqual([0, null, null])
    render(<ModelSummaryChart modelData={models} observedData={observations} />)
    const heart = screen.getByRole('article', { name: 'Heart Rate' })
    expect(heart.querySelectorAll('circle')).toHaveLength(0)
    expect(within(heart).getByRole('img').getAttribute('aria-label')).toContain('not available')
    const ventilation = screen.getByRole('article', { name: 'Minute Ventilation' })
    expect(ventilation.querySelectorAll('circle')).toHaveLength(1)
  })

  it('labels all seven axes and exposes numerical estimates accessibly', () => {
    render(<ModelSummaryChart modelData={[model({ Abbreviation: 'HR', Full_Diff: -1.23456789 })]} observedData={[]} />)
    expect(screen.getAllByRole('img')).toHaveLength(7)
    expect(screen.getAllByText('Change (mmHg)')).toHaveLength(3)
    expect(screen.getAllByText('Change (percentage points)')).toHaveLength(2)
    expect(screen.getByText('Change (bpm)')).toBeDefined()
    expect(screen.getByText('Change (L/min)')).toBeDefined()
    expect(screen.getByRole('img', { name: /HR: change/ }).getAttribute('aria-label')).toContain('Fully adjusted: -1.23456789 bpm')
    expect(screen.getByText(/Confidence intervals for these changes remain under review/)).toBeDefined()
  })

  it('does not modify the supplied result objects', () => {
    const result = Object.freeze(model({ Abbreviation: 'ARTs', Base_Diff: 1.111111111, Full_Diff: 2.222222222 }))
    const obs = Object.freeze(observed({ Abbreviation: 'ARTs', Diff_Mean: 3.333333333 }))
    const before = JSON.stringify([result, obs])
    const panel = buildSummaryChangePanels([result], [obs]).find(item => item.code === 'ARTs')!
    expect(panel.points.map(point => point.value)).toEqual([3.333333333, 1.111111111, 2.222222222])
    expect(JSON.stringify([result, obs])).toBe(before)
  })
})
