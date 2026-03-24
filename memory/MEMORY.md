---
id: memory-index
scope: "Lightweight routing index — auto-loaded every session via junction from auto-memory"
soul_tags: [Reproducibility, Honesty, Guardianship]
branch: shared
type: index
last_updated: "2026-03-24"
---
# Project Memory — SCANDAT ICU Transfusion Dashboard

## How This Works

This file is auto-loaded into every Claude Code session via a filesystem junction:
`~/.claude/projects/<dir>/memory/` → `<repo>/memory/`

- **This file**: routing index. Provides branch routing and file manifest.
- **Topic files**: loaded on demand. Read §What to Know first (~5-10 lines), §Understanding when actively working.
- **Cross-cutting tasks**: read `cross-cutting.md` to identify which topic files to load together.
- **In-repo schema**: files use `id`, `scope`, `soul_tags`, `branch`, `type` frontmatter — not auto-memory schema.

---

## Branch Routing

| Session type | Entry point | Scope |
|-------------|-------------|-------|
| **Development** | [dev/dev-index.md](dev/dev-index.md) | Frontend, SAS pipeline, testing, deployment |
| **Research** | [research/research-index.md](research/research-index.md) | Methodology, manuscript, analytical experience, SCANDAT |

### Loading Protocol
- **"read dev branch"** → Read `dev/dev-index.md`, then §What to Know from each relevant topic file
- **"read research branch"** → Read `research/research-index.md`, then §What to Know from each relevant topic file
- **No branch specified** → Infer from task (code/tests/UI/deploy → dev, statistics/manuscript/methodology → research). If ambiguous, ask.
- **Cross-branch discovery**: if dev work produces a research insight, route the capture to the research topic file. If research reveals a code bug, route to the dev topic file.

---

## File Manifest

| File | Scope |
|------|-------|
| **Shared** | |
| [SOUL.md](SOUL.md) | Deep convictions — 11 impressions governing all decisions |
| [principles-ledger.md](principles-ledger.md) | Soul-tagged principles from Post-Fix Protocol + promotion workflow |
| [data-integrity.md](data-integrity.md) | Data quality diseases: SAS encoding, CSV pipeline, model consistency |
| [capture-templates.md](capture-templates.md) | 6 template types for structured knowledge capture |
| [cross-cutting.md](cross-cutting.md) | Multi-file read patterns for tasks spanning topic boundaries |
| **Dev branch** | |
| [dev/dev-index.md](dev/dev-index.md) | Dev branch entry: frontend, SAS, testing, deployment, Post-Fix |
| [dev/frontend-patterns.md](dev/frontend-patterns.md) | React 18 / TS 5 / Zustand 4 / Chart.js 4 architecture |
| [dev/sas-pipeline.md](dev/sas-pipeline.md) | SAS scripts, PowerShell runners, data pipeline |
| [dev/testing-patterns.md](dev/testing-patterns.md) | Vitest infrastructure, coverage, conventions |
| **Research branch** | |
| [research/research-index.md](research/research-index.md) | Research branch entry: methodology, manuscript, SCANDAT, Post-Fix |
| [research/methodology.md](research/methodology.md) | Model specs, inference approach, interactions, assumptions |
| [research/manuscript.md](research/manuscript.md) | STROBE manuscript, table/figure correspondence, conversion |
| [research/analytical-experience.md](research/analytical-experience.md) | CI fix, model evolution, null findings, data quality lessons |
| [research/scandat.md](research/scandat.md) | SCANDAT3-S registry, variables, ethics, study population |

---

## Active Work

| Direction | Status |
|-----------|--------|
| Memory stack | Operational — junctions, auto-sync hooks, validation script (2026-03-24) |
| Dashboard | Feature-complete, deployed to GitHub Pages |
| SAS pipeline | Functional, 3 scripts running, CI fix applied |
| Manuscript | Advanced draft, pending journal submission |
| Test coverage expansion | Planned — data transformation functions first |
