---
id: capture-templates
scope: "Structured formats for non-bug knowledge capture: decisions, discoveries, conventions, methodology, insights"
soul_tags: [Honesty, Reproducibility]
branch: shared
type: methodology
last_updated: "2026-03-24"
---
# Capture Templates

## What to Know

- Use for non-bug knowledge capture (~60% of knowledge); Post-Fix Protocol covers bugs (~40%)
- Soul tags mandatory on all captures; routing to correct topic file is the primary value
- 6 template types: Decision, Data Discovery, Convention, Design Rationale, Research Insight, Methodology Note
- Research Insights follow promotion ladder: Low (first observation) → Medium (consistent pattern) → High (formally tested)
- Methodology Notes are unique to the research context — capture statistical decisions with enough detail for peer review

---

## Quick Reference

| Type | When | Key fields | Routes to | Ledger? |
|------|------|-----------|-----------|---------|
| **Decision** | Chose X over Y, reasoning matters | Decision, alternatives, reasoning, soul tags, reversibility | Relevant topic file | If reasoning crystallizes a reusable principle |
| **Data Discovery** | Data quality issue or unexpected SAS behavior | Symptom, root cause, resolution, impact, soul tags | `data-integrity.md` | If behavior implies a reusable rule |
| **Convention** | Pattern confirmed across 2+ sessions | Convention, evidence, scope, soul tags | Branch index + Principles Ledger | Yes — conventions are confirmed principles |
| **Design Rationale** | Architectural choice needs to survive across sessions | Component, design, rationale, tradeoffs, soul tags | `docs/architecture.md` + relevant topic file | If rationale crystallizes a reusable principle |
| **Research Insight** | Analytical observation, not yet confirmed | Observation, evidence, confidence, implications, soul tags | `analytical-experience.md` | Only after confirmation (High confidence) |
| **Methodology Note** | Statistical method decision or validation | Method, specification, justification, assumptions, soul tags | `methodology.md` | If it establishes a reusable methodological rule |

---

## Decision

*An architectural, design, or methodology choice that should survive across sessions.*

| Field | Content |
|-------|---------|
| **Context** | What prompted the decision |
| **Options** | What alternatives existed |
| **Choice** | What was chosen |
| **Rationale** | Why — connect to soul impressions |
| **Reversibility** | Easy (config change) / Medium (code refactor) / Hard (rerun all models) |
| **Soul Tags** | Which impressions apply |
| **Trade-offs** | What was sacrificed |

## Data Discovery

*A new data quality issue or unexpected behavior in the SAS-CSV-dashboard pipeline.*

| Field | Content |
|-------|---------|
| **Symptom** | How the issue manifested |
| **Root Cause** | Why it happened (SAS encoding, CSV format, TypeScript parsing, etc.) |
| **Resolution** | How it was fixed, or OPEN if unresolved |
| **Category** | Which `data-integrity.md` category (1-10) |
| **Impact** | Which outputs are affected (CSV files, dashboard tabs, manuscript tables) |
| **Soul Tags** | Which impressions apply |

## Convention

*A coding or methodology pattern established through repeated use.*

| Field | Content |
|-------|---------|
| **Pattern** | The convention being established (imperative form) |
| **Applies To** | Which files/areas |
| **Example** | Concrete code or methodology example |
| **Rationale** | Why this convention — connect to soul impressions |

## Design Rationale

*Why a non-obvious approach was chosen for an architectural component.*

| Field | Content |
|-------|---------|
| **Component** | What was designed |
| **Approach** | What approach was taken |
| **Alternatives Rejected** | What was considered and why rejected |
| **Constraints** | What forced the choice |
| **Soul Tags** | Which impressions apply |

## Research Insight

*An analytical observation from the research process that may apply beyond the immediate context.*

| Field | Content |
|-------|---------|
| **Observation** | What was noticed (one sentence) |
| **Evidence** | Data/analysis supporting it — model output, coefficient values, p-values |
| **Confidence** | High / Medium / Low |
| | **High**: Directly supported by pre-specified analysis with p<0.05 or clear effect size |
| | **Medium**: Consistent with data patterns but not formally pre-specified or tested |
| | **Low**: Hypothesis based on observation, needs formal analysis |
| **Implications** | What it means for the manuscript, future analysis, or clinical interpretation |
| **Counter-evidence** | What would invalidate this observation |
| **Soul Tags** | Which impressions apply |

**Promotion rule**: Low → Medium: pattern persists across subgroups or sensitivity analyses. Medium → High: formally tested in pre-specified framework. High observations may enter the Principles Ledger.

**Routes to**: `analytical-experience.md` under the appropriate section (Model Evolution, Null Finding Experience, Data Quality Discoveries, Statistical Observations).

## Methodology Note

*A statistical method decision with enough detail for another researcher to evaluate.*

| Field | Content |
|-------|---------|
| **Method** | Statistical method being documented |
| **Specification** | Exact model specification or formula |
| **Justification** | Why this method was chosen over alternatives |
| **Assumptions** | What assumptions it requires |
| **Validation** | How assumptions were checked |
| **Sensitivity** | What happens if assumptions are violated |
| **Soul Tags** | Which impressions apply |

**Routes to**: `methodology.md` under the appropriate section.

---

## Notes

- **Post-Fix Protocol still governs bugs.** These templates handle the other ~60%: decisions, discoveries, conventions, design rationale, research insights, and methodology notes.
- **Soul tags are not optional.** Every piece of knowledge connects to a governing conviction.
- **Confirmation before promotion.** Research Insights stay in topic files until confirmed at High confidence. Decisions and conventions can go to the Principles Ledger immediately.
- **Reversibility matters.** In research, a "Hard to reverse" decision (like changing spline knot placement) has cascading effects through all SAS output, CSV files, dashboard displays, and manuscript numbers. Document these with extra care.
