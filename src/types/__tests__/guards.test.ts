import { describe, it, expect } from 'vitest'
import {
  isVitalParamCode,
  isCompFactorCode,
  VITAL_PARAM_CODES,
  COMP_FACTOR_CODES,
} from '../vitals'

describe('type guards', () => {
  describe('isVitalParamCode', () => {
    it('returns true for valid vital param codes', () => {
      VITAL_PARAM_CODES.forEach(code => {
        expect(isVitalParamCode(code)).toBe(true)
      })
    })

    it('returns true for specific valid codes', () => {
      expect(isVitalParamCode('ARTm')).toBe(true)
      expect(isVitalParamCode('HR')).toBe(true)
      expect(isVitalParamCode('SPO2')).toBe(true)
    })

    it('returns false for invalid codes', () => {
      expect(isVitalParamCode('INVALID')).toBe(false)
      expect(isVitalParamCode('')).toBe(false)
      expect(isVitalParamCode('artm')).toBe(false) // case sensitive
    })

    it('returns false for non-string types', () => {
      expect(isVitalParamCode(null)).toBe(false)
      expect(isVitalParamCode(undefined)).toBe(false)
      expect(isVitalParamCode(123)).toBe(false)
      expect(isVitalParamCode({})).toBe(false)
      expect(isVitalParamCode([])).toBe(false)
    })
  })

  describe('isCompFactorCode', () => {
    it('returns true for valid comp factor codes', () => {
      COMP_FACTOR_CODES.forEach(code => {
        expect(isCompFactorCode(code)).toBe(true)
      })
    })

    it('returns true for specific valid codes', () => {
      expect(isCompFactorCode('DonorHb_Cat')).toBe(true)
      expect(isCompFactorCode('Storage_Cat')).toBe(true)
      expect(isCompFactorCode('DonorSex')).toBe(true)
    })

    it('returns false for invalid codes', () => {
      expect(isCompFactorCode('INVALID')).toBe(false)
      expect(isCompFactorCode('')).toBe(false)
      expect(isCompFactorCode('donorhb_cat')).toBe(false) // case sensitive
    })

    it('returns false for non-string types', () => {
      expect(isCompFactorCode(null)).toBe(false)
      expect(isCompFactorCode(undefined)).toBe(false)
      expect(isCompFactorCode(123)).toBe(false)
    })
  })
})
