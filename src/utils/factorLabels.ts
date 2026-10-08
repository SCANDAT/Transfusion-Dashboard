// Display labels for the exported categories; these do not regroup observations.
export const PARITY_DESCRIPTION = 'Donor parity is shown using the exported 0/1 category across all donors. Parity 0 includes male donors; this is not a comparison restricted to female donors.'

export const STORAGE_DESCRIPTION = 'Storage duration before transfusion, shown using the five exported category labels.'

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  donorhb_cat: {
    '1': '<125 g/L',
    '2': '125-139 g/L',
    '3': '140-154 g/L',
    '4': '155-169 g/L',
    '5': '≥170 g/L',
  },
  storage_cat: {
    '1': '<10 days',
    '2': '10-19 days',
    '3': '20-29 days',
    '4': '30-39 days',
    '5': '≥40 days',
  },
  wdy_donation: {
    '1': 'Sunday',
    '2': 'Monday',
    '3': 'Tuesday',
    '4': 'Wednesday',
    '5': 'Thursday',
    '6': 'Friday',
    '7': 'Saturday',
  },
  donorsex: {
    '1': 'Male',
    '2': 'Female',
    M: 'Male',
    F: 'Female',
  },
  donorparity: {
    '0': 'Parity 0 (includes male donors)',
    '1': 'Parity 1',
    Nulliparous: 'Parity 0 (includes male donors)',
    Parous: 'Parity 1',
  },
}

/** Preserve unrecognised categories instead of assigning them to a known group. */
export function getFactorCategoryLabel(factor: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'Missing'
  const category = String(value).trim()
  if (category === '' || category === '.') return 'Missing'
  const label = CATEGORY_LABELS[factor.toLowerCase()]?.[category]
  return typeof label === 'string' ? label : category
}
