---
id: methodology
scope: statistical-methods
soul_tags:
  - Rigor
  - Mechanism
  - Understanding
  - Reproducibility
branch: research
type: topic
last_updated: "2026-03-24"
---

## What to Know

The SCANDAT ICU transfusion study uses two model specifications: a base model and a fully adjusted model, both implemented via linear mixed-effects regression in SAS PROC MIXED. Vital sign trajectories around transfusion are modeled with natural cubic splines using 7 knots placed at -660, -360, -60, 0, +60, +360, and +660 minutes relative to transfusion start. Random intercepts account for within-patient clustering across repeated transfusions. The core inferential quantity is the pre-to-post change in each vital parameter, estimated using a change-model approach rather than independent prediction differencing. This change-model approach was adopted after discovering that differencing independently predicted values ignores the covariance between those predictions, yielding incorrect standard errors. The ESTIMATE statement in PROC MIXED directly estimates the contrast (post minus pre) with the correct variance-covariance structure. Interaction models (Script 3) extend this framework to test whether transfusion-associated changes differ across 5 donor/component factors.

## Understanding

### Model Specifications

The base model regresses a vital parameter (e.g., mean arterial pressure) on the following fixed effects:
- **Time relative to transfusion**: natural cubic spline with 7 knots at -660, -360, -60, 0, +60, +360, +660 minutes. This captures the nonlinear trajectory of vitals in the peri-transfusion window.
- **Age at transfusion**: natural cubic spline (3 knots at the 10th, 50th, and 90th percentiles). Accounts for age-related baseline differences in hemodynamics.
- **Time from ICU admission**: natural cubic spline (3 knots). Controls for acute illness trajectory and treatment intensity patterns that evolve over the ICU stay.
- **Cumulative transfusion count**: linear term. Adjusts for the fact that patients receiving their 5th unit may differ systematically from those receiving their 1st.
- **Sex**: binary indicator (male/female). Adjusts for known sex-based differences in cardiovascular physiology.
- **ICU ward**: categorical (8 wards across 4 hospitals). Controls for unit-level practice variation and case-mix differences.

The fully adjusted model adds:
- **Crystalloid volume in the observation window**: natural cubic spline (3 knots). Key confounder — fluid administration is a co-intervention that directly affects hemodynamics and is likely correlated with the decision to transfuse.
- **Vasopressor dose in the observation window**: natural cubic spline (3 knots). Same confounding-by-indication logic as crystalloids — sicker patients receive both vasopressors and transfusions.
- **Sedative indicators**: binary variables for propofol, midazolam, and other sedatives administered during the window. Sedatives depress cardiovascular function and are common in the ICU population.

Random effects: a random intercept for each patient (PatientID). This accounts for the correlation among multiple transfusion episodes within the same patient. The G-matrix is unstructured for the intercept variance. The residual (R-side) covariance uses a simple diagonal structure.

All models are fit via restricted maximum likelihood (REML). Denominator degrees of freedom use the Kenward-Roger approximation.

### Inference Approach

The central estimand is the change in a vital parameter from a defined pre-transfusion time point to a defined post-transfusion time point. The naive approach — predict the vital at time_pre, predict at time_post, subtract — was initially implemented but later identified as flawed.

**Why differencing was invalid**: When you compute Y_post_hat - Y_pre_hat from the same model, the two predictions share estimated coefficients. Their covariance is nonzero. Simply taking Var(Y_post_hat) + Var(Y_pre_hat) as the variance of the difference ignores the -2*Cov(Y_post_hat, Y_pre_hat) term, producing inflated standard errors and conservative inference. In the spline context, this correlation can be substantial because both time points share the same basis coefficients.

**The fix**: The ESTIMATE statement in PROC MIXED directly computes the linear contrast L'beta where L encodes the difference between the spline basis evaluated at time_post and time_pre. PROC MIXED then computes the correct variance L'*Cov(beta_hat)*L, which automatically captures the covariance. This yields tighter, correct confidence intervals.

This was discovered in December 2025 and required re-running all analyses. The corrected estimates were generally similar in point estimate magnitude but had narrower confidence intervals, strengthening the significance of several findings. See `analytical-experience.md` for the full narrative.

The ESTIMATE statement also allows direct estimation of changes at specific time contrasts (e.g., -360 to +360 minutes, or -60 to +60 minutes), enabling reporting of changes over different windows without separate model runs.

### Interaction Models

Script 3 extends the base framework to test whether the vital sign trajectory — and therefore the pre-to-post change — differs by donor or component characteristics. For each of the 5 component factors, the model adds:

- **Factor main effect**: categorical indicator for the factor levels.
- **Factor x time-spline interaction**: full interaction between the factor categories and the 7-knot time spline. This allows each factor level to have its own trajectory shape.

**Type 3 tests**: A Type 3 F-test on the interaction terms tests the null hypothesis that all factor levels share the same time trajectory. This is the primary test for whether a component factor modifies the transfusion effect. These tests are reported as overall p-values in Table 3 of the manuscript.

**Trajectory-based change estimates**: For each factor level, the ESTIMATE statement computes the pre-to-post change specific to that category. This yields category-specific change estimates with confidence intervals, allowing inspection of where differences might arise even if the overall interaction test is non-significant.

**Three types of p-values reported**: (1) the Type 3 interaction p-value (does the trajectory shape differ?), (2) the p-value for each category-specific change estimate (is the change within this category significantly different from zero?), and (3) pairwise contrast p-values between factor levels when relevant. All are reported without multiplicity adjustment, with the Type 3 test serving as a gatekeeper.

### Covariates

Each covariate was selected based on clinical and epidemiological reasoning:

- **Time spline**: The fundamental exposure axis. Without it, there is no trajectory to estimate changes from. The 7-knot placement was chosen to give flexibility near the transfusion event (knots at -60, 0, +60) while still capturing trends over the broader 11-hour window (knots at -660, -360, +360, +660).
- **Age**: Older patients have different baseline hemodynamics (higher systolic BP, lower HR reserve). Spline because the relationship is not linear.
- **Time from admission**: Proxies for illness acuity trajectory. Early admissions are more acute; adjustment prevents confounding by timing.
- **Cumulative transfusion count**: Patients requiring many transfusions are systematically sicker. Linear because the relationship was approximately monotone in exploratory analyses.
- **Sex**: Biological sex affects cardiovascular parameters. Binary indicator is sufficient.
- **ICU ward**: Practice variation across units (transfusion thresholds, monitoring intensity, case mix). Fixed effect with 8 levels.
- **Crystalloid volume**: Direct confounder by indication. Clinicians who give fluids and transfuse are responding to hemodynamic instability. Spline because the dose-response to crystalloids is nonlinear.
- **Vasopressor dose**: Same confounding-by-indication logic. Vasopressors directly elevate MAP and can lower HR reflexively. Spline for the same reason as crystalloids.
- **Sedatives**: Propofol, midazolam, and others lower blood pressure and can affect HR. Binary indicators (given/not given) because dose information was less reliably captured.

### Key Findings

The primary finding is that RBC transfusion is associated with a modest increase in mean arterial pressure (MAP) and a decrease in heart rate (HR) in the peri-transfusion window:
- **MAP**: approximately +2.06 mmHg (95% CI: 1.82, 2.30) in the base model, attenuated to approximately +1.51 mmHg in the fully adjusted model.
- **HR**: approximately -1.05 bpm (95% CI: -1.30, -0.80) in the base model, with modest attenuation after full adjustment.
- **SpO2**: small increase, consistent with improved oxygen delivery.
- **Other parameters** (FiO2, minute ventilation, systolic/diastolic arterial pressure): changes present but smaller or less consistent.

Attenuation from base to fully adjusted model is expected: crystalloid and vasopressor co-administration explains part of the observed hemodynamic change, consistent with confounding by indication.

**Component factor findings**: All 5 donor/component factors (storage duration, donor sex, donor parity, donor hemoglobin, day of donation) showed null results for trajectory modification. No Type 3 interaction test reached conventional significance for any vital parameter. This is a key null finding — none of the tested component characteristics meaningfully alter the vital sign response to transfusion.

### Assumptions and Limitations

**Statistical assumptions**:
- Linearity of the fixed-effects model conditional on spline transformations. The splines relax linearity in time, age, and other continuous covariates, but the model is still linear in parameters.
- Normality of random effects and residuals. PROC MIXED assumes Gaussian random intercepts. With 6,736 patients, moderate departures are unlikely to substantially affect fixed-effect inference, but this was not formally tested.
- Correct spline specification. The 7-knot placement was chosen based on clinical reasoning (more flexibility near the event) rather than data-driven knot selection, which is appropriate for confirmatory analysis but means some trajectory features between knots could be smoothed over.
- Missing data are handled by the implicit MAR (missing at random) assumption of likelihood-based mixed models. Observations present contribute to estimation; missing observations are assumed uninformative conditional on included covariates.

**Design limitations**:
- **Observational design**: No randomization. Transfusion is triggered by clinical indication, meaning confounding by indication is the dominant threat. The fully adjusted model mitigates but cannot eliminate this.
- **Unmeasured confounders**: APACHE scores (illness severity), specific diagnoses (sepsis vs. trauma vs. cardiac), and surgical status were not available in the linked dataset. These could confound the transfusion-vital sign association.
- **Time-stamp precision**: Clinisoft records vital signs at variable intervals, not continuously. The spline model interpolates between observed measurements, which may miss rapid transient changes.
- **Single-region cohort**: All 4 hospitals are in the Stockholm region. Generalizability to other health systems, transfusion practices, or patient populations is uncertain.
- **Component factor power**: The null findings for component factors could reflect true absence of effect or insufficient power to detect small modifications, particularly for rarer factor levels (e.g., high-parity donors).
- **No dose-response modeling**: The analysis treats each transfusion event as a single unit rather than modeling the number of units transfused in a single episode, which could obscure dose-dependent effects.
