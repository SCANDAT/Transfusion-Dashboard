---
id: research-index
scope: "Research branch entry point — methodology, manuscript, analytical experience, SCANDAT, Post-Fix Protocol"
soul_tags: [Honesty, Rigor, Reproducibility]
branch: research
type: branch-index
last_updated: "2026-03-24"
---
# Research Branch Index

Entry point for all analytical work — statistical methodology, manuscript preparation, analytical
experience, and SCANDAT database knowledge. The research layer is the intellectual foundation;
the development layer is its expression. Every dashboard feature and every manuscript paragraph
must trace back to a statistical result from the SAS pipeline.

---

## What to Know

- Two model specifications: base (6 covariates) and fully adjusted (adds crystalloid/vasopressor/sedatives)
- Change-model approach for valid pre-post inference; independent-prediction method was replaced Dec 2025
- All 5 component factors showed null interaction effects — this is the main secondary finding
- Manuscript follows STROBE guidelines; every number traces to SAS output
- SCANDAT3-S registry links donor characteristics to transfusion outcomes; pseudonymized, GDPR applies
- Confidence tiers for research insights: High (formally tested) → Medium (consistent pattern) → Low (hypothesis)

---

## Routing Table

| If touching... | Read first |
|---|---|
| Statistical models, p-values, CIs | [methodology.md](methodology.md) |
| Manuscript text, tables, figures | [manuscript.md](manuscript.md) → verify against SAS output |
| SCANDAT variables, linkage, registries | [scandat.md](scandat.md) |
| Past bugs, lessons learned, model evolution | [analytical-experience.md](analytical-experience.md) |
| Study population, inclusion criteria | [scandat.md](scandat.md) + [methodology.md](methodology.md) |
| Component factors, interaction models | [methodology.md](methodology.md) §Interaction Models |
| Data quality, CSV issues | [../data-integrity.md](../data-integrity.md) |
| SAS script specifics | [../dev/sas-pipeline.md](../dev/sas-pipeline.md) |
| Principles reference | [../principles-ledger.md](../principles-ledger.md) |

**Reading protocol**: Read each topic file's §What to Know section first (~8-10 lines). Consult §Understanding only when actively working in that area.

---

## Methodology Gates

Before modifying any statistical analysis:
1. State the hypothesis being tested
2. Specify the model explicitly (equation form, not just name)
3. Identify the assumptions required
4. Check whether the data satisfy those assumptions (or document why they approximately do)
5. Run on sample data first (`npm run analysis`)
6. Compare results with previous run — any unexpected changes must be investigated
7. Update manuscript if results change

Before adding a new analysis:
1. Is it prespecified or exploratory? Label honestly [Honesty]
2. Does it address a question reviewers would ask?
3. What is the minimal model that answers the question? [Rigor]
4. What assumptions does it add? Are they defensible?

---

## Post-Fix Protocol (Research)

After fixing any methodology error or discovering a data quality issue:

1. **Record** the issue in [../data-integrity.md](../data-integrity.md) with full context
2. **Trace impact through the chain**: SAS script → CSV output → dashboard display → manuscript text. Which numbers changed? Which tables/figures?
3. **Verify the fix**: rerun SAS script, compare old vs new output quantitatively
4. **Update the manuscript** if any reported numbers changed. Cross-reference Tables 2 and 3 explicitly
5. **Record the lesson** in [analytical-experience.md](analytical-experience.md) with confidence tier
6. **Check** [../principles-ledger.md](../principles-ledger.md) — does this fix suggest a new principle?
7. **Consider systematic impact**: does this fix apply to all vital parameters? All component factors? Is it a one-off or a pattern?

The research Post-Fix adds impact tracing (step 2), manuscript update (step 4), and lesson recording (step 5) beyond the dev variant. These steps ensure the full SAS → CSV → dashboard → manuscript pipeline stays consistent.

---

## Confidence Tiers

When recording research insights in [analytical-experience.md](analytical-experience.md), classify by confidence:

- **Tier 1 (High)**: Directly supported by pre-specified analysis with p<0.05 or clear effect size. Goes directly into manuscript Results. Example: "RBC transfusion increases MAP by ~2 mmHg (95% CI: 1.8-2.3)."
- **Tier 2 (Medium)**: Consistent with data patterns but not formally pre-specified. Goes into Discussion as interpretation. Example: "The attenuation after full adjustment suggests confounding by clinical severity."
- **Tier 3 (Low)**: Hypothesis based on observation, needs formal testing. Goes into analytical-experience.md only. Example: "The ≥170 g/L donor Hb category has an unexpected negative MAP change, but N=65 is too small to interpret."

Promotion: Low → Medium when pattern persists across subgroups or sensitivity analyses. Medium → High when formally tested in pre-specified framework. High observations may enter the Principles Ledger.

---

## Fresh Analysis Workflow

When a session starts and you need to analyze specific results:
1. **Check server**: Is the dev server running? (`npm run dev`)
2. **Identify the question**: Which vital parameter? Which component factor? Base or full model?
3. **Locate the data**: `public/data/VIZ_{VITAL}_{FACTOR}.csv` for visualization data, `*_summary.csv` for tables
4. **Cross-reference**: Does the dashboard display match manuscript Table 2 or 3?
5. **Analyze using staged workflow**:
   - Descriptive: What do the distributions look like? (Script 1 output)
   - Main effects: What is the estimated change? (Script 2 output)
   - Interactions: Does any component factor modify the effect? (Script 3 output)
   - Interpret: consult [methodology.md](methodology.md) for model specification, [analytical-experience.md](analytical-experience.md) for known patterns
6. **Record**: capture insights to [analytical-experience.md](analytical-experience.md) using the Research Insight template

---

## System Status (2026-03-24)

Honest assessment of the research layer:

### What works well

| Capability | Status | Notes |
|-----------|--------|-------|
| Main analyses (Scripts 1-3) | Complete | Validated, results consistent |
| CI calculation | Corrected | Dec 2025 change-model fix applied |
| Manuscript | Advanced draft | All numbers reflect current SAS output |
| Component factor analysis | Complete | Null results across all 5 factors |
| Dashboard-manuscript consistency | Verified | Figure 1 matches Script 2 trajectories |

### What's fragile or incomplete

| Capability | Status | Issue |
|-----------|--------|-------|
| Sensitivity analyses | Sparse | Alternative knot placements not formally tested |
| Subgroup analyses | Not done | No formal subgroup analyses beyond component factors |
| Peer review response | Pending | Manuscript not yet submitted |

### Deferred Research Notes

- Sensitivity analysis with different spline knot placements has not been formally conducted
- The fully adjusted model attenuated effects substantially for heart rate; this pattern deserves deeper discussion
- The weekday-of-donation factor was included for completeness but has no strong biological rationale [Mechanism]
- The ≥170 g/L donor Hb category shows unexpected patterns with small N — flagged as Low confidence

---

## See Also

- [../data-integrity.md](../data-integrity.md) — disease catalog
- [../principles-ledger.md](../principles-ledger.md) — soul-tagged rules
- [../dev/sas-pipeline.md](../dev/sas-pipeline.md) — SAS script details
- [../dev/frontend-patterns.md](../dev/frontend-patterns.md) — dashboard architecture
- [../../docs/architecture.md](../../docs/architecture.md) — system architecture
