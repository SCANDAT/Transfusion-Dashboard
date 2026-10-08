import { getFactorCategoryLabel } from '@/utils/factorLabels'
import { isFiniteNumber } from '@/components/charts/formatChartEstimate'
import React, { useMemo } from 'react'
import type { FactorObservedSummaryRow, FactorModelSummaryRow } from '@/types'
import { VITAL_PARAMS, COMP_FACTORS, VITAL_PARAM_CODES, COMP_FACTOR_CODES } from '@/types'
import styles from './MainFindings.module.css'
import { FactorSummaryNotes } from './FactorSummaryNotes'

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

// eslint-disable-next-line react-refresh/only-export-components
export function useGroupedFactorData(
  observedData: FactorObservedSummaryRow[],
  modelData: FactorModelSummaryRow[]
): GroupedFactorData[] {
  return useMemo(() => {
    const factorGroups = new Map<string, GroupedFactorData>()

    for (const row of observedData) {
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

    for (const row of modelData) {
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
      if (!group.categories.includes(row.FactorCategory)) group.categories.push(row.FactorCategory)

      if (!group.dataByVital.has(row.Abbreviation)) {
        group.dataByVital.set(row.Abbreviation, new Map())
      }

      const vitalMap = group.dataByVital.get(row.Abbreviation)!
      if (!vitalMap.has(row.FactorCategory)) {
        vitalMap.set(row.FactorCategory, {})
      }
      vitalMap.get(row.FactorCategory)!.model = row
    }

    factorGroups.forEach(group => {
      group.categories.sort((a, b) => {
        const numA = parseFloat(String(a))
        const numB = parseFloat(String(b))
        if (!isNaN(numA) && !isNaN(numB)) {
          if (group.factorCode === 'wdy_donation') {
            const orderA = numA === 1 ? 8 : numA
            const orderB = numB === 1 ? 8 : numB
            return orderA - orderB
          }
          return numA - numB
        }
        return String(a).localeCompare(String(b))
      })
    })

    return COMP_FACTOR_CODES
      .filter(code => factorGroups.has(code))
      .map(code => factorGroups.get(code)!)
  }, [observedData, modelData])
}

const formatValue = (val: number | undefined, decimals = 2) => {
  if (!isFiniteNumber(val)) return '—'
  return val.toFixed(decimals)
}

// Preserve the existing helper export for callers.
// eslint-disable-next-line react-refresh/only-export-components
export const getCategoryLabel = getFactorCategoryLabel

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
                  {' ('}{VITAL_PARAMS[vital as keyof typeof VITAL_PARAMS]?.unit === '%'
                    ? 'percentage points' : VITAL_PARAMS[vital as keyof typeof VITAL_PARAMS]?.unit}{')'}
                </th>
              ))}
            </tr>
            <tr>
              <th></th>
              {vitalsWithData.map(vital => (
                <React.Fragment key={`${vital}-headers`}>
                  <th className={styles.thSub}>Observed</th>
                  <th className={styles.thSub}>No-interaction model<sup>1</sup></th>
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
                          </div>
                        ) : '—'}
                      </td>
                      <td className={styles.effectCell}>
                        {catData?.model ? (
                          <div className={styles.effectValue}>
                            <span className={styles.estimate}>
                              {formatValue(catData.model.Full_Diff)}
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

export function SummaryTableB({ observedData, modelData }: SummaryTableBProps) {
  const groupedData = useGroupedFactorData(observedData, modelData)

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
      <FactorSummaryNotes />
    </>
  )
}
