import { useMemo } from 'react'
import type { VitalSummaryRow, ModelVitalSummaryRow } from '@/types'
import { VITAL_PARAMS, VITAL_PARAM_CODES } from '@/types'
import { isFiniteNumber } from '@/components/charts/formatChartEstimate'
import { ModelNotes } from './ModelNotes'
import styles from './MainFindings.module.css'

interface SummaryTableAProps {
  observedData: VitalSummaryRow[]
  modelData: ModelVitalSummaryRow[]
}

export function SummaryTableA({ observedData, modelData }: SummaryTableAProps) {
  const rows = useMemo(() => VITAL_PARAM_CODES.flatMap(code => {
    const observed = observedData.find(row => row.Abbreviation === code)
    const model = modelData.find(row => row.Abbreviation === code)
    return observed || model ? [{ code, observed, model }] : []
  }), [observedData, modelData])

  const formatValue = (value: unknown) => isFiniteNumber(value) ? value.toFixed(2) : '—'

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label="Observed levels and changes from one hour before to one hour after transfusion">
          <thead>
            <tr>
              <th rowSpan={2} className={styles.thSticky} scope="col">Vital parameter</th>
              <th colSpan={2} className={styles.thGroup} scope="colgroup">T−1h observed</th>
              <th colSpan={2} className={styles.thGroup} scope="colgroup">T+1h observed</th>
              <th colSpan={3} className={styles.thGroup} scope="colgroup">Change: +1h minus −1h</th>
            </tr>
            <tr>
              <th className={styles.thSub} scope="col">Mean</th>
              <th className={styles.thSub} scope="col">SD</th>
              <th className={styles.thSub} scope="col">Mean</th>
              <th className={styles.thSub} scope="col">SD</th>
              <th className={styles.thSub} scope="col">Observed</th>
              <th className={styles.thSub} scope="col">Base model</th>
              <th className={styles.thSub} scope="col">Fully adjusted (primary)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ code, observed, model }) => (
              <tr key={code}>
                <th className={styles.vitalName} scope="row">
                  <span className={styles.vitalCode}>{VITAL_PARAMS[code].shortName}</span>
                  <span className={styles.vitalFullName}>
                    {VITAL_PARAMS[code].name} ({VITAL_PARAMS[code].unit})
                  </span>
                </th>
                <td className={styles.numCellFirst}>{formatValue(observed?.Pre_Mean)}</td>
                <td className={styles.numCell}>{formatValue(observed?.Pre_SD)}</td>
                <td className={styles.numCellFirst}>{formatValue(observed?.Post_Mean)}</td>
                <td className={styles.numCell}>{formatValue(observed?.Post_SD)}</td>
                <td className={styles.numCellFirst}>{formatValue(observed?.Diff_Mean)}</td>
                <td className={styles.numCellFirst}>{formatValue(model?.Base_Diff)}</td>
                <td className={styles.numCellFirst}>{formatValue(model?.Full_Diff)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.tableFootnotes}>
        <p>
          Observed changes compare paired pre/post-window means centred on −1 and +1 hour.
          Model changes compare predictions at exactly −60 and +60 minutes.
          Changes in FiO₂ and SpO₂ are expressed in percentage points; SD describes observed variability.
        </p>
        <p>
          Change confidence intervals and standard errors are omitted pending verification of
          same-model covariance and repeated-patient inference. Pointwise intervals on the trajectory
          plots describe uncertainty in predicted levels, not in these changes.
        </p>
      </div>
      <ModelNotes />
    </>
  )
}
