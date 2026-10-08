import { describe, expect, it } from 'vitest'
import { formatChartEstimate } from '../formatChartEstimate'

describe('formatChartEstimate', () => {
  it('preserves a real zero and finite interval limits', () => {
    expect(formatChartEstimate('Observed', 0, -1.25, 1.25)).toBe('Observed: 0.00 [-1.25, 1.25]')
  })

  it.each([null, undefined, NaN, Infinity])('does not format a missing or invalid estimate (%s)', missing => {
    expect(formatChartEstimate('Observed', missing, -1, 1)).toBe('Observed: unavailable')
  })

  it.each([null, undefined, NaN, Infinity])('shows an estimate safely when a bound is unavailable (%s)', missing => {
    expect(formatChartEstimate('Observed', 2, missing, 3)).toBe('Observed: 2.00 (CI unavailable)')
    expect(formatChartEstimate('Observed', 2, 1, missing)).toBe('Observed: 2.00 (CI unavailable)')
  })
})
