---
id: data-integrity
scope: "Data quality diseases: SAS encoding, CSV pipeline, missing data, model specification consistency"
soul_tags: [Weight, Honesty, Uniformity, Guardianship]
branch: shared
type: catalog
last_updated: "2026-03-24"
---
# Data Integrity — Disease Catalog

## What to Know

- SAS output uses Swedish abbreviations for some vital parameters — always normalize before comparison
- CSV is the contract between SAS and dashboard — case sensitivity and encoding matter
- The CI calculation fix (Dec 2025) was the most significant methodology correction in the project
- Missing data is handled per-factor (not global exclusion) — a transfusion missing parity still contributes to sex analysis
- Model specification consistency: base vs fully adjusted produce different estimates; labels must indicate which
- Storage duration categories must match exactly between SAS categorization and dashboard display
- LOESS data files are optional — dashboard silently falls back to empty arrays
- SAS `(u)` suffix on some variable labels must be stripped during normalization

---

## Understanding

### 1: SAS Abbreviation Incoherence

> **Insight**: SAS output uses Swedish abbreviations (`Hjartfrekv` for Heart Rate, etc.) while the dashboard expects standardized English codes (`HR`). Any new vital parameter requires updating both layers.

- **Symptom**: Dashboard shows "Unknown vital parameter" or blank labels
- **Root Cause**: SAS macro variables use Swedish clinical abbreviations from the source Clinisoft EHR system
- **Resolution**: `normalizeVitalAbbreviation()` in `dataService.ts` maintains a translation table
- **Risk**: Adding a new vital parameter requires updating: (1) the SAS output labels, (2) the normalization function, (3) the `VITAL_PARAM_CODES` TypeScript constant
- **Tags**: [Uniformity]
- **Principle**: NORMALIZE_BEFORE_COMPARE

### 2: Confidence Interval Computation (RESOLVED Dec 2025)

> **Insight**: Script 2 previously computed SE of the pre-post difference assuming independence between T-60 and T+60 predictions. This inflated CIs because predictions from the same model for the same patient are correlated.

- **Symptom**: CIs in Table 2 were wider than expected for the observed effect sizes
- **Root Cause**: `SE_diff = sqrt(SE_pre² + SE_post²)` assumes independence, which is false for predictions from the same mixed model
- **Resolution**: Changed to "change model" approach — the ESTIMATE statement in PROC MIXED directly estimates the difference with proper standard errors that account for correlation
- **Impact**: All CI widths in Table 2 changed (narrowed). Manuscript updated accordingly. The narrowing is correct — the change model properly accounts for within-patient correlation
- **Tags**: [Rigor, Weight]
- **Principle**: CHANGE_MODEL_FOR_INFERENCE
- **Lesson**: This is the canonical data integrity disease in this project. See [analytical-experience.md §The CI Calculation Fix](research/analytical-experience.md)

### 3: CSV Case Sensitivity

> **Insight**: SAS outputs uppercase filenames (`VIZ_ARTM_DONORHB_CAT.csv`) but some web server configurations and local contexts may expect lowercase.

- **Symptom**: 404 errors when loading visualization data in certain deployment environments
- **Root Cause**: Windows filesystem is case-insensitive; Linux-based hosts are case-sensitive
- **Resolution**: `fetchCSVWithFallback()` tries the exact filename first, then lowercase variant
- **Tags**: [Uniformity]
- **Principle**: CSV_CASE_SENSITIVITY

### 4: Missing Data Handling

> **Insight**: Transfusion events with missing component factor values are excluded per-factor, not globally. This is intentional and documented in Methods.

- **Design**: A transfusion with unknown donor parity but known donor sex contributes to the sex analysis but not the parity analysis. This maximizes statistical power per factor while being honest about data availability.
- **Documentation**: Stated in manuscript Methods: "Analyses of component factors were performed on the subset of transfusions with available data for each factor."
- **Risk**: If a factor is nearly universally missing, its N drops substantially. Check per-factor N in Script 3 output.
- **Tags**: [Honesty, Rigor]

### 5: Parity Encoding

> **Insight**: Donor parity values arrive as numeric (0/1) from SAS but must display as "Nulliparous"/"Parous" in the dashboard.

- **Resolution**: Mapping in `dataService.ts` via `parityMap`. The SAS variable `donor_parity` is coded 0=nulliparous, 1=parous.
- **Risk**: Any additional parity categories (e.g., unknown) would require updating both the SAS categorization and the TypeScript mapping.
- **Tags**: [Uniformity]
- **Principle**: PARITY_ENCODING_MAP

### 6: LOESS Data Optionality

> **Insight**: LOESS smoothing files (`VIZ_LOESS.csv`, `VIZ_LOESS_final_with_range.csv`) may not exist in all analysis runs. The dashboard silently falls back to empty arrays.

- **Behavior**: `loadLoessData()` catches fetch errors and returns empty dataset. No error displayed to user.
- **Risk**: If LOESS data is expected but missing, the span selector UI may appear without data. No crash, but misleading empty state.
- **Tags**: [Patience]

### 7: Age Group Boundary Encoding

> **Insight**: SAS outputs age groups as `20-` (meaning 20-29) rather than `20-29`. The dashboard maps these compact notations.

- **Resolution**: `loadDescriptiveStatistics()` handles the mapping from SAS compact format to full range labels
- **Tags**: [Uniformity]
- **Principle**: AGE_GROUP_BOUNDARY

### 8: Swedish Character Encoding

> **Insight**: Some SAS output contains Swedish characters (e.g., `Hjärtfrekv`). CSV files must be UTF-8 encoded. The normalization function also strips the `(u)` suffix that SAS sometimes appends to variable labels.

- **Resolution**: PapaParse handles UTF-8 decoding. `normalizeVitalAbbreviation()` strips suffixes and translates Swedish names.
- **Tags**: [Uniformity]
- **Principle**: SWEDISH_CHAR_ENCODING

### 9: Storage Duration Computation

> **Insight**: Storage duration is computed as days from collection to transfusion. The categorization boundaries must match exactly between SAS (`proc format`) and dashboard display labels.

- **Categories**: <10, 10-19, 20-29, 30-39, ≥40 days
- **Risk**: If SAS boundaries change without updating dashboard labels, the chart legends will be incorrect — a Weight violation.
- **Tags**: [Uniformity, Weight]
- **Principle**: STORAGE_DURATION_CATEGORIES

### 10: Model Specification Consistency

> **Insight**: The base model and fully adjusted model produce different estimates for the same vital parameter change. The dashboard can display either via the `showBaseModel` toggle. Labels must clearly indicate which model is shown.

- **Base model**: Adjusts for time (spline), age (spline), time-from-admission (spline), cumulative transfusion count, sex, ICU ward
- **Full model**: Adds crystalloid volume (spline), vasopressor volume (spline), sedative indicators
- **Risk**: If labels do not clearly distinguish "Base model" from "Fully adjusted model," a reader may compare numbers from different models — a severe Weight violation
- **Tags**: [Weight, Honesty]
- **Principle**: CI_MUST_MATCH_MODEL

---

## Meta-Patterns

### Cross-Layer Disease Tracing
Most data integrity issues in this project involve encoding mismatches between SAS and TypeScript. The fix pattern is always: (1) identify the mismatch, (2) fix at the translation layer (normalization function, mapping table, or `fetchCSVWithFallback`), (3) verify both sides produce consistent output. Post-Fix "check scope" must trace the full pipeline: SAS → CSV → `dataService.ts` → component → display.

### The CI Fix as Template
The CI calculation fix (Disease #2) is the template for how methodology errors should be handled: (1) identify the statistical error, (2) implement the correct method, (3) rerun all affected analyses, (4) compare old vs new output quantitatively, (5) update the manuscript, (6) record the lesson. Every future methodology fix should follow this pattern.
