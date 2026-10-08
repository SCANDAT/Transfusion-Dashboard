import styles from './MainFindings.module.css'

export function FactorSummaryNotes() {
  return (
    <div className={styles.tableFootnotes}>
      <p>
        These archived summaries show within-category point estimates of change from −1 to +1 hour;
        they do not estimate differences between categories. Each chart has its own outcome scale.
      </p>
      <p>
        <sup>1</sup><strong>No-interaction model:</strong> Model without time-by-factor interactions.
        These models differ from the interaction models used for the trajectory plots.
        The table reports fully adjusted estimates; the charts also offer the base model.
      </p>
      <p>
        Uncertainty is not shown. Valid model-change intervals require contrasts from the same
        fitted model; observed-change inference remains under review.
      </p>
    </div>
  )
}
