import { describe, expect, it } from 'vitest'
import { getFactorCategoryLabel } from '../factorLabels'
import { COMP_FACTORS } from '@/types/vitals'

describe('exported factor labels', () => {
  it('identifies parity zero as a category containing male donors', () => {
    for (const value of [0, '0', 'Nulliparous']) {
      expect(getFactorCategoryLabel('DonorParity', value)).toBe('Parity 0 (includes male donors)')
    }
    expect(getFactorCategoryLabel('DonorParity', 1)).toBe('Parity 1')
    expect(getFactorCategoryLabel('DonorParity', 'Parous')).toBe('Parity 1')
  })

  it('does not recode unknown, missing or unexpected parity values as parity one', () => {
    for (const value of ['Unknown', 'U', 2, '__proto__']) {
      expect(getFactorCategoryLabel('DonorParity', value)).toBe(String(value))
    }
    for (const value of [undefined, null, '', '.', '  ']) {
      expect(getFactorCategoryLabel('DonorParity', value)).toBe('Missing')
    }
  })

  it('lists the five exported storage categories without inventing alternative bins', () => {
    expect(COMP_FACTORS.Storage_Cat.categories).toEqual([
      '<10 days', '10-19 days', '20-29 days', '30-39 days', '≥40 days',
    ])
    expect(COMP_FACTORS.DonorHb_Cat.categories).toHaveLength(5)
    expect(COMP_FACTORS.DonorParity.categories).toEqual([
      'Parity 0 (includes male donors)', 'Parity 1',
    ])
  })

  it('keeps formatted labels stable when passed from services to displays', () => {
    for (const factor of ['DonorHb_Cat', 'Storage_Cat', 'wdy_donation', 'DonorSex', 'DonorParity']) {
      for (const value of [0, 1, 2, 'Unknown']) {
        const label = getFactorCategoryLabel(factor, value)
        expect(getFactorCategoryLabel(factor, label)).toBe(label)
        expect(getFactorCategoryLabel(factor.toUpperCase(), value)).toBe(label)
      }
    }
  })
})
