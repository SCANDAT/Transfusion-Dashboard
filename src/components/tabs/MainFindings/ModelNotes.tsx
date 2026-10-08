import styles from './MainFindings.module.css'

/** Describes the archived trajectory specification; not a claim of corrected inputs. */
export function ModelNotes() {
  return (
    <div className={styles.tableFootnotes}>
      <p>
        <strong>Base trajectory model:</strong> A linear mixed model with a patient-specific random
        intercept, patient sex and ICU ward. Natural cubic splines represent time from transfusion
        (knots at −660, −360, −60, 0, 60, 360 and 660 minutes), age and time from ICU admission
        to transfusion. The archived model also includes a within-patient measurement-row counter;
        this variable does not count RBC transfusions.
      </p>
      <p>
        <strong>Fully adjusted trajectory model:</strong> Adds recorded crystalloid and noradrenaline
        volumes and indicators of exposure to the study medication class over the preceding 1 and
        24 hours. These windows precede each measurement. The medication class includes analgesics
        as well as sedatives.
      </p>
      <p>
        <strong>Prediction profile:</strong> Male sex, the most frequent ward for each outcome and
        outcome-specific mean values of the other covariates. These are predictions for that profile,
        not averages of individual patients’ predicted trajectories.
      </p>
    </div>
  )
}
