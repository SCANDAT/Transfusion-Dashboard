---
id: cross-cutting
scope: "Multi-file read patterns for tasks that span topic boundaries"
soul_tags: [Uniformity, Reproducibility]
branch: shared
type: reference
last_updated: "2026-03-24"
---
# Cross-Cutting Concepts

When a task spans multiple topic files, consult these sections together:

| Concept | Read |
|---------|------|
| Data flow (SAS → CSV → Dashboard) | dev/sas-pipeline.md §Data Pipeline, dev/frontend-patterns.md §Data Flow |
| Model specifications ↔ SAS implementation | research/methodology.md, dev/sas-pipeline.md §Script Architecture |
| Variable definitions ↔ TypeScript types | research/scandat.md §Variable Definitions, dev/frontend-patterns.md §Type System |
| CI calculation fix (full chain) | research/analytical-experience.md §CI Fix, data-integrity.md §2, research/methodology.md §Inference |
| Manuscript ↔ Dashboard consistency | research/manuscript.md §Table/Figure, dev/frontend-patterns.md §Chart.js |
| Ethics / GDPR / data protection | SOUL.md (Guardianship, Vigilance), research/scandat.md §Data Access |
| Encoding mismatches (SAS ↔ TS) | data-integrity.md §1/§5/§7/§8, dev/frontend-patterns.md §Data Flow |
| Base vs fully adjusted model display | data-integrity.md §10, research/methodology.md §Model Specifications |
