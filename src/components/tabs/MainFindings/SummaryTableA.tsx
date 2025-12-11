import { useMemo } from 'react'
import type { VitalSummaryRow, ModelVitalSummaryRow, VitalParamCode } from '@/types'
import { VITAL_PARAMS } from '@/types'
import styles from './MainFindings.module.css'

interface SummaryTableAProps {
  observedData: VitalSummaryRow[]
  modelData: ModelVitalSummaryRow[]
}

/**
 * Table 2a: Vital Parameter Summary
 * Shows pre/post transfusion values with observed and model-based estimates
 */
export function SummaryTableA({ observedData, modelData }: SummaryTableAProps) {
  // Merge observed and model data by VitalParam
  const mergedData = useMemo(() => {
    return observedData.map(obs => {
      const model = modelData.find(m => m.Abbreviation === obs.Abbreviation)
      return { observed: obs, model }
    })
  }, [observedData, modelData])

  const formatValue = (val: number | undefined, decimals = 2) => {
    if (val === undefined || val === null || isNaN(val)) return '—'
    return val.toFixed(decimals)
  }

  const formatCI = (lower: number | undefined, upper: number | undefined, decimals = 2) => {
    if (lower === undefined || upper === undefined) return '—'
    return `[${formatValue(lower, decimals)}, ${formatValue(upper, decimals)}]`
  }

  // Calculate SE from 95% CI: SE ≈ (UCL - LCL) / (2 * 1.96)
  const calculateSE = (lower: number | undefined, upper: number | undefined) => {
    if (lower === undefined || upper === undefined) return undefined
    return (upper - lower) / (2 * 1.96)
  }

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th rowSpan={2} className={styles.thSticky}>Vital Parameter</th>
              <th colSpan={2} className={styles.thGroup}>T−1h (Observed)</th>
              <th colSpan={2} className={styles.thGroup}>T+1h (Observed)</th>
              <th colSpan={2} className={styles.thGroup}>Observed Change<sup>*</sup></th>
              <th colSpan={2} className={styles.thGroup}>Base Model<sup>1</sup></th>
              <th colSpan={2} className={styles.thGroup}>Fully Adjusted Model<sup>2</sup></th>
            </tr>
            <tr>
              <th className={`${styles.thSub} ${styles.thSubFirst}`}>Mean</th>
              <th className={styles.thSub}>SD</th>
              <th className={`${styles.thSub} ${styles.thSubFirst}`}>Mean</th>
              <th className={styles.thSub}>SD</th>
              <th className={`${styles.thSub} ${styles.thSubFirst}`}>Diff (SE)</th>
              <th className={styles.thSub}>95% CI</th>
              <th className={`${styles.thSub} ${styles.thSubFirst}`}>Diff (SE)</th>
              <th className={styles.thSub}>95% CI</th>
              <th className={`${styles.thSub} ${styles.thSubFirst}`}>Diff (SE)</th>
              <th className={styles.thSub}>95% CI</th>
            </tr>
          </thead>
          <tbody>
            {mergedData.map(({ observed, model }) => {
              const abbrev = observed.Abbreviation as VitalParamCode
              const vitalInfo = VITAL_PARAMS[abbrev]
              return (
                <tr key={abbrev}>
                  <td className={styles.vitalName}>
                    <span className={styles.vitalCode}>{vitalInfo?.shortName ?? abbrev}</span>
                    <span className={styles.vitalFullName}>
                      {vitalInfo?.name ?? abbrev}{vitalInfo?.unit ? ` (${vitalInfo.unit})` : ''}
                    </span>
                  </td>
                  <td className={styles.numCellFirst}>{formatValue(observed.Pre_Mean)}</td>
                  <td className={styles.numCell}>{formatValue(observed.Pre_SD)}</td>
                  <td className={styles.numCellFirst}>{formatValue(observed.Post_Mean)}</td>
                  <td className={styles.numCell}>{formatValue(observed.Post_SD)}</td>
                  <td className={styles.numCellFirst}>
                    {formatValue(observed.Diff_Mean)} ({formatValue(calculateSE(observed.Diff_LCL, observed.Diff_UCL))})
                  </td>
                  <td className={styles.ciCell}>{formatCI(observed.Diff_LCL, observed.Diff_UCL)}</td>
                  {model ? (
                    <>
                      <td className={styles.numCellFirst}>
                        {formatValue(model.Base_Diff)} ({formatValue(model.Base_Diff_SE)})
                      </td>
                      <td className={styles.ciCell}>
                        {formatCI(model.Base_Diff_LCL, model.Base_Diff_UCL)}
                      </td>
                      <td className={styles.numCellFirst}>
                        {formatValue(model.Full_Diff)} ({formatValue(model.Full_Diff_SE)})
                      </td>
                      <td className={styles.ciCell}>
                        {formatCI(model.Full_Diff_LCL, model.Full_Diff_UCL)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td colSpan={4} className={styles.numCellFirst}>—</td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className={styles.tableFootnotes}>
        <p>
          <sup>*</sup><strong>Observed Change:</strong> Difference between observed values at 1 hour before (T−1h) and 1 hour after (T+1h) transfusion.
        </p>
        <p>
          <sup>1</sup><strong>Base Model:</strong> A linear mixed-effects model with a random intercept for patient ID, adjusted for time relative to transfusion using a cubic spline (knots at −660, −360, −60, 0, 60, 360, and 660 minutes). Additional covariates included patient age, time from ICU admission to transfusion (cubic spline with three percentile-based knots), cumulative number of RBC transfusions, patient sex, and ICU ward.
        </p>
        <p>
          <sup>2</sup><strong>Fully Adjusted Model:</strong> A linear mixed-effects model including all variables from the Base Model, additionally adjusted for cumulative volumes (in ml) of crystalloid fluids and vasopressors administered within the 1- and 24-hour periods preceding transfusion (each modeled using natural cubic splines with three percentile-based knots), and binary indicators for sedative administration during the same intervals.
        </p>
      </div>
    </>
  )
}
