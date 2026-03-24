---
id: analytical-experience
scope: research-insights
soul_tags:
  - Rigor
  - Honesty
  - Weight
  - Patience
  - Humility
branch: research
type: topic
last_updated: "2026-03-24"
---

## What to Know

This file captures accumulated lessons from the analytical process of the SCANDAT ICU transfusion study. Entries are organized by theme and tagged with confidence tiers: **High** (formally tested or mathematically demonstrated), **Medium** (consistent pattern observed across multiple analyses), **Low** (hypothesis or single-instance observation). The canonical entry is the CI calculation fix discovered in December 2025, which revealed that independently differencing model predictions yielded incorrect standard errors. This file grows over time as new insights emerge — the capture template in `capture-templates.md` provides the format for adding entries. Key themes include model evolution decisions, the experience of presenting null findings honestly, data quality patterns discovered during development, and practical lessons about computational scale when working with GB-level intermediate datasets in SAS.

## Understanding

### The CI Calculation Fix (December 2025)

**Confidence: High** | Tags: [Rigor, Weight]

In December 2025, a fundamental error was discovered in how confidence intervals for pre-to-post vital sign changes were being calculated. The error affected all reported change estimates and their associated inference.

**What was wrong**: The original approach computed the predicted vital sign value at a pre-transfusion time point (e.g., -360 minutes) and at a post-transfusion time point (e.g., +360 minutes), each with its own standard error and confidence interval. The change was estimated as the simple difference of these two predictions. The standard error of the change was computed as sqrt(SE_pre^2 + SE_post^2), which is the formula for the standard error of a difference of two *independent* quantities.

**Why it was wrong**: The pre and post predictions are not independent. They are generated from the same fitted model, sharing the same estimated regression coefficients. The covariance between the two predictions is positive (they are both functions of the same beta-hat vector). Ignoring this positive covariance inflates the variance of the difference: Var(A - B) = Var(A) + Var(B) - 2*Cov(A, B). By omitting the -2*Cov term, the standard errors were systematically too large.

**How it was discovered**: During a routine review of SAS output, the confidence intervals for MAP change appeared wider than expected given the sample size and effect magnitude. A back-of-envelope calculation suggested the CIs should be narrower. Investigation of the prediction covariance structure confirmed the omitted covariance term.

**What changed**: The fix replaced the two-step predict-then-difference approach with a single ESTIMATE statement in PROC MIXED. The ESTIMATE statement specifies the contrast directly as a linear combination of the spline basis values at the two time points. PROC MIXED then computes the variance of this contrast using the full variance-covariance matrix of the estimated coefficients, correctly accounting for the covariance between pre and post predictions.

**Impact on interpretation**: Point estimates of change were largely unaffected (the difference of predictions gives the same point estimate either way). However, confidence intervals narrowed substantially — in some cases by 15-25%. Several vital parameter changes that were borderline significant became clearly significant. The MAP finding strengthened from a marginal to a robust result. All tables and figures in the manuscript were regenerated with corrected estimates.

This episode underscores why the change-model approach should always be preferred over independent prediction differencing in regression contexts. It is now a standing methodological lesson for the project.

### Model Evolution

**Confidence: Medium** | Tags: [Rigor, Mechanism, Patience]

The statistical model evolved through several stages during the project:

1. **Simple pre-post comparison**: The earliest exploratory analysis compared mean vital signs in a pre-transfusion window to a post-transfusion window using paired t-tests. This ignored confounders, time trends, and within-patient correlation. It served only to confirm that the data showed a signal worth investigating.

2. **Linear mixed model with linear time**: The first regression model used time as a linear predictor with a random intercept for patient. This captured the direction of change but forced a constant rate of change across the entire observation window, which was biologically implausible (vital signs do not change linearly over 11 hours).

3. **Polynomial time terms**: Quadratic and cubic time terms were tested to allow curvature. These improved fit near the transfusion event but created implausible oscillations at the window edges (Runge phenomenon). They also made interpretation of specific time-point contrasts difficult.

4. **Natural cubic splines**: The final specification uses restricted (natural) cubic splines with 7 knots. Natural splines are constrained to be linear beyond the boundary knots, preventing edge oscillations. The 7-knot placement was chosen to concentrate flexibility near the transfusion event (knots at -60, 0, +60 minutes) while providing adequate coverage of the broader window (-660, -360, +360, +660 minutes).

**Why splines over polynomials**: Splines provide local flexibility — a change in data near one knot does not propagate to the entire curve, unlike global polynomials. Natural cubic splines have the additional advantage of stable extrapolation behavior. The 7-knot specification was validated by visual inspection of residual plots and by comparing AIC/BIC across 5-, 7-, and 9-knot specifications (7 knots provided adequate fit without overfitting).

**Why these specific knot positions**: The asymmetric clustering near time zero reflects the clinical expectation that hemodynamic changes are most rapid immediately around transfusion. Wider spacing at the window edges captures slower baseline drift. The positions were fixed a priori based on clinical reasoning rather than data-driven selection, which is appropriate for a confirmatory analysis.

### Null Finding Experience

**Confidence: High** | Tags: [Honesty, Humility, Weight]

All 5 component factors tested in the interaction models (storage duration, donor sex, donor parity, donor hemoglobin, day of donation) yielded null results across all 7 vital parameters. No Type 3 interaction test reached conventional statistical significance.

**Presenting null findings honestly**: The temptation in a null-result scenario is to either (a) downplay the analysis ("we also looked at...") or (b) over-interpret trends that do not reach significance ("a trend toward significance was observed for..."). Both approaches compromise scientific integrity. The manuscript presents the null findings with the same methodological detail and tabular precision as the positive primary findings.

**What the nulls mean**: The null results are consistent with two interpretations — either the tested component factors genuinely do not modify the acute hemodynamic response to RBC transfusion, or the study lacked power to detect small modifications. The discussion addresses both possibilities explicitly, noting that the sample size provides reasonable power for moderate effect modifications but may miss subtle interactions.

**Framing in the manuscript**: The null component factor findings are positioned as a substantive result, not a failure. They contribute to the evidence base by narrowing the range of plausible effect sizes for these factors. The discussion connects to the broader literature on storage lesion, donor sex effects, and other component characteristics, noting where these findings align with or diverge from prior studies.

### Data Quality Discoveries

**Confidence: Medium** | Tags: [Vigilance, Guardianship, Reproducibility]

Several data quality issues were discovered during the analytical process and dashboard development:

- **Encoding mismatches between SAS and TypeScript**: SAS uses its own internal encoding for character variables, while the TypeScript dashboard reads exported CSV/JSON. Special characters (Swedish characters a-ring, a-umlaut, o-umlaut in ward names and variable labels) required explicit encoding handling. The pattern: SAS exports in one encoding, the dashboard reads in another, and comparisons fail silently because the strings look identical but have different byte representations.

- **Time-zone and daylight-saving artifacts**: The Clinisoft data spans multiple years, crossing daylight saving time boundaries. A small number of vital sign records near the spring/autumn clock changes had ambiguous timestamps. These were identified during trajectory plotting when occasional 60-minute gaps or overlaps appeared at the clock-change dates. Resolution: these records were flagged and excluded from sensitivity analyses.

- **Vital sign physiological range violations**: A small fraction of recorded vital signs fell outside physiologically plausible ranges (e.g., HR > 300 bpm, MAP < 0 mmHg). These likely represent monitoring artifacts (lead disconnection, transducer errors). They were identified during exploratory data analysis and excluded based on predefined range filters in the data preparation script.

- **Duplicate transfusion records**: A handful of transfusion events appeared duplicated in the linked dataset, likely due to administrative re-entries. These were identified by matching on patient ID, component ID, and transfusion time, and deduplicated in the data preparation step.

- **Variable label inconsistencies**: Some SAS datasets used different variable labels for the same underlying quantity (e.g., "ART_MEAN" vs. "ARTM" vs. "MeanABP"). A standardization step in Script 0 maps all variants to the canonical 7 variable names used throughout the pipeline.

### Performance and Scale

**Confidence: Medium** | Tags: [Patience, Reproducibility]

Working with the full SCANDAT-Clinisoft linked dataset involves substantial computational demands:

- **Dataset size**: The full vital-signs dataset, after linkage and windowing, is measured in gigabytes. Each transfusion episode contributes hundreds of vital sign observations across the 22-hour window, and with thousands of episodes, the total observation count is in the millions.
- **SAS execution times**: PROC MIXED on the full dataset with 7-knot splines and random intercepts takes 15-45 minutes per vital parameter per model specification. Running all 7 vital parameters across base and fully adjusted models, plus interaction models for 5 component factors, requires multiple hours of cumulative SAS runtime.
- **Intermediate files**: SAS generates large intermediate datasets during PROC MIXED estimation. These can individually reach hundreds of megabytes. Disk space management on the university workstation requires periodic cleanup of intermediate outputs between analysis runs.
- **Memory requirements**: PROC MIXED loads the entire dataset (or at least the relevant BY-group) into memory for estimation. With millions of observations and the variance-covariance matrix of hundreds of fixed-effect parameters, peak memory usage can reach several gigabytes. The university workstation was configured with sufficient RAM, but memory was occasionally a constraint during development when multiple SAS sessions ran simultaneously.
- **Iteration strategy**: Due to the long runtimes, the development workflow used a sample dataset (random subset of patients) for rapid iteration on model specification and code debugging. Full-dataset runs were reserved for final production analyses. This two-tier approach was essential for maintaining development velocity while ensuring final results used complete data.
