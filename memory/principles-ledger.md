---
id: principles-ledger
scope: "Soul-tagged principles from Post-Fix Protocol — the bridge between convictions and methodology"
soul_tags: [Weight, Honesty, Humility, Mechanism, Rigor, Understanding, Uniformity, Patience, Guardianship, Vigilance, Reproducibility]
branch: shared
type: ledger
last_updated: "2026-03-24"
---
# Principles Ledger

Soul-tagged principles confirmed through Post-Fix Protocol. Each entry links to a topic file with full details.
Read during periodic review or when tracing a principle to its soul impression.

**Routing**: new principles → add here with `[SoulTag]` + topic file link. If refining an existing one, update rather than duplicate.

### Core Gates
*The most critical principles that fire across all work. Scan here first.*

| Principle | Tags | One-line rule |
|-----------|------|---------------|
| DASHBOARD_DISPLAYS_SAS_COMPUTES | [Weight, Reproducibility] | Never perform statistical computation in TypeScript — SAS is the single source of truth |
| CI_MUST_MATCH_MODEL | [Weight, Rigor] | Base model CIs and fully adjusted CIs are different estimates; never mix them |
| CHANGE_MODEL_FOR_INFERENCE | [Rigor] | Pre-post differences use change-model approach, not independent predictions |
| NORMALIZE_BEFORE_COMPARE | [Uniformity] | All vital abbreviations pass through `normalizeVitalAbbreviation` before display or comparison |
| SOURCE_DATA_NEVER_COMMITTED | [Guardianship, Vigilance] | `D:\` paths, `.sas7bdat` files, and patient-level data never enter git |
| NULL_FINDINGS_ARE_FINDINGS | [Honesty] | Component factor null results reported with same rigor and precision as positive findings |
| DESCRIPTIVE_BEFORE_INFERENTIAL | [Understanding, Patience] | Run Script 1 and review distributions before running Scripts 2-3 |
| SPLINE_KNOTS_JUSTIFIED | [Rigor] | Knots at -660, -360, -60, 0, +60, +360, +660 min; document rationale for any change |
| CSV_IS_THE_CONTRACT | [Uniformity, Reproducibility] | SAS outputs CSV; dashboard consumes CSV; no intermediate formats in the pipeline |
| PSEUDONYMIZED_NOT_ANONYMOUS | [Guardianship, Vigilance] | Treat pseudonymized data as sensitive; GDPR Article 4(5) applies; re-identification risk exists |
| MANUSCRIPT_TRACES_TO_SAS | [Reproducibility, Weight] | Every number in the manuscript must be traceable through SAS output to source data |
| ASSOCIATION_NOT_CAUSATION | [Humility, Honesty] | Observational data: use "associated with," never "caused" or "led to" |
| MECHANISM_SCAFFOLDS_INTERPRETATION | [Mechanism] | Statistical findings are interpreted through biological plausibility, not accepted at face value |
| ATTENUATION_IS_INFORMATIVE | [Humility, Honesty] | When full adjustment attenuates effects, discuss what confounders explain the change |
| CONSERVATIVE_WHEN_UNCERTAIN | [Guardianship, Humility] | When methodology choices are ambiguous, prefer the more conservative estimate |

---

### Data Integrity & Pipeline
→ [data-integrity.md](data-integrity.md)

- **NORMALIZE_BEFORE_COMPARE** [Uniformity]: SAS outputs Swedish abbreviations (`Hjartfrekv`); `normalizeVitalAbbreviation()` translates before any comparison or display. Adding a new vital parameter requires updating both SAS output naming and the normalization function. → [data-integrity.md §SAS Abbreviation Incoherence](data-integrity.md)
- **CSV_CASE_SENSITIVITY** [Uniformity]: SAS outputs uppercase filenames; some contexts expect lowercase. `fetchCSVWithFallback()` tries uppercase first, then lowercase. → [data-integrity.md §CSV Case Sensitivity](data-integrity.md)
- **PARITY_ENCODING_MAP** [Uniformity]: Donor parity arrives as numeric (0/1) from SAS; dashboard maps to "Nulliparous"/"Parous" via `parityMap` in `dataService.ts`. → [data-integrity.md §Parity Encoding](data-integrity.md)
- **AGE_GROUP_BOUNDARY** [Uniformity]: SAS outputs `20-` meaning 20-29; dashboard maps in `loadDescriptiveStatistics()`. → [data-integrity.md §Age Group Boundary Encoding](data-integrity.md)
- **SWEDISH_CHAR_ENCODING** [Uniformity]: Some SAS output contains Swedish characters; CSV must be UTF-8; normalization strips the `(u)` suffix SAS appends. → [data-integrity.md §Swedish Character Encoding](data-integrity.md)
- **STORAGE_DURATION_CATEGORIES** [Uniformity, Weight]: Category boundaries (<10, 10-19, 20-29, 30-39, ≥40 days) must match between SAS definitions and dashboard display labels. → [data-integrity.md §Storage Duration Computation](data-integrity.md)

### Statistical Methodology
→ [methodology.md](research/methodology.md)

- **CHANGE_MODEL_FOR_INFERENCE** [Rigor]: Independent-prediction differencing inflates CIs because predictions from the same model are correlated. The ESTIMATE statement in PROC MIXED directly estimates the change with proper standard errors. → [methodology.md §Inference Approach](research/methodology.md)
- **SPLINE_KNOTS_JUSTIFIED** [Rigor]: 7 knots at clinical decision boundaries. Any modification requires rerunning all models and updating the manuscript. → [methodology.md §Model Specifications](research/methodology.md)
- **RANDOM_INTERCEPTS_FOR_CLUSTERING** [Rigor]: Patients contribute multiple transfusion episodes; random intercepts account for within-patient correlation. → [methodology.md §Model Specifications](research/methodology.md)
- **TYPE_3_FOR_INTERACTIONS** [Rigor]: Script 3 uses Type 3 tests for overall trajectory differences between component factor categories. → [methodology.md §Interaction Models](research/methodology.md)
- **COVARIATE_RATIONALE_DOCUMENTED** [Rigor, Understanding]: Every covariate in the fully adjusted model has a stated rationale. Crystalloid/vasopressor volumes: confounding by indication. Sedatives: binary, not continuous. → [methodology.md §Covariates](research/methodology.md)

### Frontend Architecture
→ [frontend-patterns.md](dev/frontend-patterns.md)

- **SINGLE_ZUSTAND_STORE** [Uniformity]: One store (`dashboardStore.ts`), selectors as functions, `useShallow` for multi-field selectors, persist only theme + activeTab. → [frontend-patterns.md §State Management](dev/frontend-patterns.md)
- **LAZY_LOAD_ALL_TABS** [Patience]: All 5 tab components are `React.lazy()` with `Suspense` fallback. Keeps initial bundle small. → [frontend-patterns.md §Tab Architecture](dev/frontend-patterns.md)
- **DATA_SERVICE_SINGLE_SOURCE** [Uniformity, Reproducibility]: `dataService.ts` is the single entry point for all data fetching. No direct CSV fetch outside this service. → [frontend-patterns.md §Data Flow](dev/frontend-patterns.md)
- **ERROR_BOUNDARY_PER_TAB** [Guardianship]: Each tab wrapped in `ErrorBoundary` + `Suspense`. A failing tab does not crash the entire dashboard. → [frontend-patterns.md §Tab Architecture](dev/frontend-patterns.md)

### SAS Pipeline
→ [sas-pipeline.md](dev/sas-pipeline.md)

- **SCRIPT_ORDER_MATTERS** [Understanding, Patience]: Script 1 (descriptive) → Script 2 (main effects) → Script 3 (interactions). Script 1 output informs Script 2 interpretation. → [sas-pipeline.md §Script Architecture](dev/sas-pipeline.md)
- **MANUAL_CSV_COPY** [Reproducibility]: `analysis/script_data/` → `public/data/` is a manual step. Verify file counts and sizes after copy. → [sas-pipeline.md §Data Pipeline](dev/sas-pipeline.md)
- **KILL_ANALYSIS_EXISTS** [Guardianship]: `kill_analysis.ps1` for emergency SAS process termination. SAS processes can consume GBs of memory. → [sas-pipeline.md §PowerShell Runners](dev/sas-pipeline.md)

### Manuscript & Reporting
→ [manuscript.md](research/manuscript.md)

- **STROBE_ADHERENCE** [Rigor, Honesty]: Manuscript follows STROBE guidelines for observational studies. Checklist items are not optional. → [manuscript.md §Style Conventions](research/manuscript.md)
- **TABLE_FIGURE_CORRESPONDENCE** [Reproducibility, Weight]: Table 1 → Script 1, Table 2 → Script 2, Table 3 → Script 3, Figure 1 → Script 2 trajectory plots. Each number traces back. → [manuscript.md §Table/Figure Correspondence](research/manuscript.md)
- **CLINICAL_UNITS_ALWAYS** [Weight, Uniformity]: Numbers always with units (mmHg, bpm, %, L/min). CIs in parenthetical format. P-values to specified decimal places. → [manuscript.md §Style Conventions](research/manuscript.md)

### Ethics & Security
→ [scandat.md](research/scandat.md)

- **SOURCE_DATA_NEVER_COMMITTED** [Guardianship, Vigilance]: `D:\Clinisoft project\Clean data` path and `.sas7bdat` files never enter the git repository. → [scandat.md §Data Access and Ethics](research/scandat.md)
- **PSEUDONYMIZED_NOT_ANONYMOUS** [Guardianship, Vigilance]: GDPR Article 4(5) applies. The research team cannot re-identify patients, but the data controller can. → [scandat.md §Data Access and Ethics](research/scandat.md)
- **ETHICS_APPROVAL_CITED** [Guardianship]: Swedish Ethical Review Authority 2021-04890 cited in manuscript Methods and in SOUL.md. → [scandat.md §Data Access and Ethics](research/scandat.md)
- **ANALYSIS_DIR_GITIGNORED** [Vigilance]: `analysis/` directory excluded from git — contains SAS intermediate datasets derived from patient data. → [sas-pipeline.md §Known Hazards](dev/sas-pipeline.md)

### Testing
→ [testing-patterns.md](dev/testing-patterns.md)

- **REGRESSION_TEST_ON_FIX** [Rigor, Reproducibility]: When fixing a data-integrity issue, add a regression test that would have caught it. → [testing-patterns.md §Adding Tests](dev/testing-patterns.md)
- **DATA_TRANSFORM_INDEPENDENT_OF_UI** [Reproducibility]: Test data transformation functions independently of React components. → [testing-patterns.md §Testing Conventions](dev/testing-patterns.md)

---

### Growth Protocol

**Adding a principle**: Via the Post-Fix Protocol (dev or research variant). Each entry must have:
1. Principle name (SCREAMING_SNAKE_CASE)
2. Soul tags (at least one, full name format)
3. One-line rule
4. Link to the topic file where full details live

**Promoting a principle**: From project-level to global `~/.claude/CLAUDE.md` Cross-Project Conventions.

Promotion criteria — all three must hold:
1. **Confirmed in 2+ projects**: The same principle emerged independently in different repos
2. **Domain-independent**: The principle applies regardless of the specific project domain (e.g., "CSV_IS_THE_CONTRACT" is domain-independent; "SPLINE_KNOTS_JUSTIFIED" is not)
3. **Soul-connected**: The principle traces to at least one of the 11 impressions

Promotion workflow:
1. First project confirms principle → add to the Promotion Candidates table below with source and evidence
2. Second project encounters the same pattern → update the table with the confirming project
3. Both confirmations present → promote to global `~/.claude/CLAUDE.md` under Cross-Project Conventions
4. Remove from this table after promotion (the global file is now authoritative)

**Demoting a principle**: If a promoted principle is contradicted by experience in a later project:
1. Note the contradiction in this table with the counter-evidence
2. If the contradiction is confirmed (not a one-off edge case), remove from global CLAUDE.md
3. The principle may remain in individual project ledgers if it still holds locally

### Promotion Candidates

| Principle | Source Project | Evidence | Confirming Project | Status |
|-----------|--------------|----------|--------------------|--------|
| *(populate via Post-Fix Protocol when a principle appears domain-independent)* | | | | |
