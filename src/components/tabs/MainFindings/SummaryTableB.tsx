import React, { useMemo } from 'react'
import type { FactorObservedSummaryRow, FactorModelSummaryRow } from '@/types'
import { VITAL_PARAMS, COMP_FACTORS, VITAL_PARAM_CODES, COMP_FACTOR_CODES } from '@/types'
import styles from './MainFindings.module.css'

interface SummaryTableBProps {
  observedData: FactorObservedSummaryRow[]
  modelData: FactorModelSummaryRow[]
}

export interface GroupedFactorData {
  factorCode: string
  factorName: string
  categories: string[]
  dataByVital: Map<string, Map<string, {
    observed?: FactorObservedSummaryRow
    model?: FactorModelSummaryRow
  }>>
}

/**
 * Hook to group factor data - shared between table and chart components
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useGroupedFactorData(
  observedData: FactorObservedSummaryRow[],
  modelData: FactorModelSummaryRow[]
): GroupedFactorData[] {
  return useMemo(() => {
    const factorGroups = new Map<string, GroupedFactorData>()

    // Process observed data
    for (const row of observedData) {
      // Skip rows without a category, but allow '0' as a valid category
      if (row.FactorCategory === undefined || row.FactorCategory === null || row.FactorCategory === '' || row.FactorCategory === '.') continue

      const factorCode = row.FactorName
      if (!factorGroups.has(factorCode)) {
        factorGroups.set(factorCode, {
          factorCode,
          factorName: COMP_FACTORS[factorCode as keyof typeof COMP_FACTORS]?.name || factorCode,
          categories: [],
          dataByVital: new Map(),
        })
      }

      const group = factorGroups.get(factorCode)!

      if (!group.categories.includes(row.FactorCategory)) {
        group.categories.push(row.FactorCategory)
      }

      if (!group.dataByVital.has(row.Abbreviation)) {
        group.dataByVital.set(row.Abbreviation, new Map())
      }

      const vitalMap = group.dataByVital.get(row.Abbreviation)!
      if (!vitalMap.has(row.FactorCategory)) {
        vitalMap.set(row.FactorCategory, {})
      }
      vitalMap.get(row.FactorCategory)!.observed = row
    }

    // Process model data
    for (const row of modelData) {
      // Skip rows without a category, but allow '0' as a valid category
      if (row.FactorCategory === undefined || row.FactorCategory === null || row.FactorCategory === '' || row.FactorCategory === '.') continue

      const factorCode = row.FactorName
      if (!factorGroups.has(factorCode)) continue

      const group = factorGroups.get(factorCode)!

      if (!group.dataByVital.has(row.Abbreviation)) {
        group.dataByVital.set(row.Abbreviation, new Map())
      }

      const vitalMap = group.dataByVital.get(row.Abbreviation)!
      if (!vitalMap.has(row.FactorCategory)) {
        vitalMap.set(row.FactorCategory, {})
      }
      vitalMap.get(row.FactorCategory)!.model = row
    }

    // Sort categories numerically if possible
    // For weekdays, use Monday-Sunday order (2,3,4,5,6,7,1)
    factorGroups.forEach(group => {
      group.categories.sort((a, b) => {
        const numA = parseFloat(String(a))
        const numB = parseFloat(String(b))
        if (!isNaN(numA) && !isNaN(numB)) {
          // Special handling for weekdays: Monday(2) through Sunday(1)
          if (group.factorCode === 'wdy_donation') {
            const orderA = numA === 1 ? 8 : numA // Sunday becomes 8 (last)
            const orderB = numB === 1 ? 8 : numB
            return orderA - orderB
          }
          return numA - numB
        }
        return String(a).localeCompare(String(b))
      })
    })

    // Return factors in COMP_FACTOR_CODES order
    return COMP_FACTOR_CODES
      .filter(code => factorGroups.has(code))
      .map(code => factorGroups.get(code)!)
  }, [observedData, modelData])
}

const formatValue = (val: number | undefined, decimals = 2) => {
  if (val === undefined || val === null || isNaN(val)) return '—'
  return val.toFixed(decimals)
}

const formatCI = (lower: number | undefined, upper: number | undefined, decimals = 2) => {
  if (lower === undefined || upper === undefined) return ''
  return `[${formatValue(lower, decimals)}, ${formatValue(upper, decimals)}]`
}

/**
 * Get human-readable category label
 */
// eslint-disable-next-line react-refresh/only-export-components
export function getCategoryLabel(factorCode: string, category: string | number): string {
  const catStr = String(category)
  const categoryLabels: Record<string, Record<string, string>> = {
    DonorHb_Cat: {
      '1': '<125 g/L',
      '2': '125-139 g/L',
      '3': '140-154 g/L',
      '4': '155-169 g/L',
      '5': '≥170 g/L',
    },
    Storage_Cat: {
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
    DonorSex: {
      'Male': 'Male',
      'Female': 'Female',
      'M': 'Male',
      'F': 'Female',
      '1': 'Male',
      '2': 'Female',
    },
    DonorParity: {
      'Nulliparous': 'Nulliparous',
      'Parous': 'Parous',
      '0': 'Nulliparous',
      '1': 'Parous',
    },
  }

  return categoryLabels[factorCode]?.[catStr] || catStr
}

/**
 * Single factor table component - can be used standalone or in combined view
 */
interface SingleFactorTableProps {
  factorGroup: GroupedFactorData
  vitalsWithData: string[]
  showTitle?: boolean
}

export function SingleFactorTable({ factorGroup, vitalsWithData, showTitle = true }: SingleFactorTableProps) {
  return (
    <div className={styles.factorSection}>
      {showTitle && <h3 className={styles.factorTitle}>{factorGroup.factorName}</h3>}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thSticky}>Category</th>
              {vitalsWithData.map(vital => (
                <th key={vital} colSpan={2} className={styles.thVital}>
                  {VITAL_PARAMS[vital as keyof typeof VITAL_PARAMS]?.shortName || vital}
                </th>
              ))}
            </tr>
            <tr>
              <th></th>
              {vitalsWithData.map(vital => (
                <React.Fragment key={`${vital}-headers`}>
                  <th className={styles.thSub}>Observed</th>
                  <th className={styles.thSub}>Full<sup>1</sup></th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {factorGroup.categories.map(category => (
              <tr key={category}>
                <td className={styles.categoryLabel}>
                  {getCategoryLabel(factorGroup.factorCode, category)}
                </td>
                {vitalsWithData.map(vital => {
                  const vitalData = factorGroup.dataByVital.get(vital)
                  const catData = vitalData?.get(category)

                  return (
                    <React.Fragment key={`${vital}-${category}`}>
                      <td className={styles.effectCell}>
                        {catData?.observed ? (
                          <div className={styles.effectValue}>
                            <span className={styles.estimate}>
                              {formatValue(catData.observed.Diff_Mean)}
                            </span>
                            <span className={styles.ci}>
                              {formatCI(catData.observed.Diff_LCL, catData.observed.Diff_UCL)}
                            </span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className={styles.effectCell}>
                        {catData?.model ? (
                          <div className={styles.effectValue}>
                            <span className={styles.estimate}>
                              {formatValue(catData.model.Full_Diff)}
                            </span>
                            <span className={styles.ci}>
                              {formatCI(catData.model.Full_Diff_LCL, catData.model.Full_Diff_UCL)}
                            </span>
                          </div>
                        ) : '—'}
                      </td>
                    </React.Fragment>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Table 2b: Component Factor Effects Summary
 * Shows factor-specific effects grouped by component factor, with vitals as columns
 */
export function SummaryTableB({ observedData, modelData }: SummaryTableBProps) {
  const groupedData = useGroupedFactorData(observedData, modelData)

  // Get vitals that have data (use standard order from VITAL_PARAM_CODES)
  const vitalsWithData = VITAL_PARAM_CODES.filter(vital =>
    groupedData.some(g => g.dataByVital.has(vital))
  )

  return (
    <>
      <div className={styles.tableBContainer}>
        {groupedData.map(factorGroup => (
          <SingleFactorTable
            key={factorGroup.factorCode}
            factorGroup={factorGroup}
            vitalsWithData={vitalsWithData}
          />
        ))}
      </div>
      <div className={styles.tableFootnotes}>
        <p>
          <sup>1</sup><strong>Model Estimates:</strong> Based on the Fully Adjusted Model described in Table 2a, which includes all covariates from the Base Model plus cumulative crystalloid fluid and vasopressor volumes (1h and 24h prior), and sedative administration indicators.
        </p>
      </div>
    </>
  )
}
