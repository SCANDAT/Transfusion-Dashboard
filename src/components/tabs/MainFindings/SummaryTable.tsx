import { useMemo } from 'react'
import type { VitalSummaryRow, ModelVitalSummaryRow } from '@/types'
import { VITAL_PARAMS } from '@/types'
import styles from './MainFindings.module.css'

interface VitalSummaryTableProps {
  data: VitalSummaryRow[]
  title: string
}

/**
 * VitalSummaryTable - Table showing observed vital parameter summaries
 * Displays pre/post transfusion means and the difference with CI
 */
export function VitalSummaryTable({ data, title }: VitalSummaryTableProps) {
  const rows = useMemo(() => {
    return data.map(row => {
      const vitalInfo = VITAL_PARAMS[row.Abbreviation]
      return {
        ...row,
        displayName: vitalInfo?.shortName || row.Abbreviation,
        fullName: vitalInfo?.name || row.Abbreviation,
      }
    })
  }, [data])

  if (data.length === 0) {
    return <div className={styles.tableEmpty}>No data available</div>
  }

  return (
    <div className={styles.summaryTableContainer}>
      <h3 className={styles.summaryTableTitle}>{title}</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Pre-Transfusion</th>
              <th>Post-Transfusion</th>
              <th>Difference</th>
              <th>95% CI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td title={row.fullName}>{row.displayName}</td>
                <td>{row.Pre_Mean.toFixed(1)} ± {row.Pre_SD.toFixed(1)}</td>
                <td>{row.Post_Mean.toFixed(1)} ± {row.Post_SD.toFixed(1)}</td>
                <td className={row.Diff_Mean > 0 ? styles.positive : row.Diff_Mean < 0 ? styles.negative : ''}>
                  {row.Diff_Mean > 0 ? '+' : ''}{row.Diff_Mean.toFixed(2)}
                </td>
                <td>[{row.Diff_LCL.toFixed(2)}, {row.Diff_UCL.toFixed(2)}]</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ModelSummaryTableProps {
  data: ModelVitalSummaryRow[]
  title: string
}

/**
 * ModelSummaryTable - Table showing model-based vital parameter summaries
 * Displays adjusted estimates with confidence intervals
 */
export function ModelSummaryTable({ data, title }: ModelSummaryTableProps) {
  const rows = useMemo(() => {
    return data.map(row => {
      const vitalInfo = VITAL_PARAMS[row.Abbreviation]
      return {
        ...row,
        displayName: vitalInfo?.shortName || row.Abbreviation,
        fullName: vitalInfo?.name || row.Abbreviation,
      }
    })
  }, [data])

  if (data.length === 0) {
    return <div className={styles.tableEmpty}>No data available</div>
  }

  return (
    <div className={styles.summaryTableContainer}>
      <h3 className={styles.summaryTableTitle}>{title}</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th rowSpan={2}>Parameter</th>
              <th colSpan={3}>Base Model</th>
              <th colSpan={3}>Full Model (Adjusted)</th>
            </tr>
            <tr>
              <th>Diff</th>
              <th>SE</th>
              <th>95% CI</th>
              <th>Diff</th>
              <th>SE</th>
              <th>95% CI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td title={row.fullName}>{row.displayName}</td>
                <td className={row.Base_Diff > 0 ? styles.positive : row.Base_Diff < 0 ? styles.negative : ''}>
                  {row.Base_Diff > 0 ? '+' : ''}{row.Base_Diff.toFixed(2)}
                </td>
                <td>{row.Base_Diff_SE.toFixed(2)}</td>
                <td>[{row.Base_Diff_LCL.toFixed(2)}, {row.Base_Diff_UCL.toFixed(2)}]</td>
                <td className={row.Full_Diff > 0 ? styles.positive : row.Full_Diff < 0 ? styles.negative : ''}>
                  {row.Full_Diff > 0 ? '+' : ''}{row.Full_Diff.toFixed(2)}
                </td>
                <td>{row.Full_Diff_SE.toFixed(2)}</td>
                <td>[{row.Full_Diff_LCL.toFixed(2)}, {row.Full_Diff_UCL.toFixed(2)}]</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
