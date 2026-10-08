import { VITAL_PARAMS, VITAL_PARAM_CODES } from '@/types'
import type { ModelVitalSummaryRow, VitalSummaryRow, VitalParamCode } from '@/types'

export interface ChangePoint {
  label: string
  value: number | null
}

export interface ChangePanel {
  code: VitalParamCode
  name: string
  shortName: string
  unit: string
  points: ChangePoint[]
  minimum: number
  maximum: number
  ticks: number[]
}

const finiteOrMissing = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

function axisFor(values: (number | null)[]) {
  const available = values.filter((value): value is number => value !== null)
  const low = Math.min(0, ...available)
  const high = Math.max(0, ...available)
  if (low === high) return { minimum: -1, maximum: 1, ticks: [-1, 0, 1] }

  // Rounded axis ticks affect only the display domain, never the estimates.
  const roughStep = (high - low) / 3
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalized = roughStep / magnitude
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude
  const minimum = Math.floor(low / step) * step
  const maximum = Math.ceil(high / step) * step
  const count = Math.round((maximum - minimum) / step)
  const ticks = Array.from({ length: count + 1 }, (_, index) =>
    Number((minimum + index * step).toPrecision(12)))
  return { minimum, maximum, ticks }
}

export function buildSummaryChangePanels(
  modelData: ModelVitalSummaryRow[], observedData: VitalSummaryRow[]
): ChangePanel[] {
  return VITAL_PARAM_CODES.map(code => {
    const model = modelData.find(row => row.Abbreviation.toUpperCase() === code.toUpperCase())
    const observed = observedData.find(row => row.Abbreviation.toUpperCase() === code.toUpperCase())
    const vital = VITAL_PARAMS[code]
    const points = [
      { label: 'Observed', value: finiteOrMissing(observed?.Diff_Mean) },
      { label: 'Base model', value: finiteOrMissing(model?.Base_Diff) },
      { label: 'Fully adjusted', value: finiteOrMissing(model?.Full_Diff) },
    ]
    return {
      code,
      name: vital.name,
      shortName: vital.shortName,
      unit: vital.unit === '%' ? 'percentage points' : vital.unit,
      points,
      ...axisFor(points.map(point => point.value)),
    }
  })
}

export function formatChangeValue(value: number): string {
  if (value === 0) return '0'
  return Number(value.toPrecision(4)).toString()
}
