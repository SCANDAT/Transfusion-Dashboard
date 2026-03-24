# SCANDAT ICU Transfusion Dashboard — Project Instructions

## Soul
This project is governed by `memory/SOUL.md` (in the project memory directory).
Every rule below is a crystallization of those impressions.
Read SOUL.md at the start of substantive work.

## Project Identity
- **Study**: RBC transfusion effects on ICU vital parameters
- **Population**: 6,736 patients, 14,655 transfusions, 4 Stockholm hospitals (2014-2018)
- **PI**: Gustaf Edgren, Karolinska Institutet
- **Lead author**: Lucas D. Ekstrom
- **Ethics**: Swedish Ethical Review Authority 2021-04890
- **Live dashboard**: https://scandat.github.io/Transfusion-Dashboard/

## Tech Stack
- Frontend: React 18, TypeScript 5, Vite 5, Zustand 4, Chart.js 4
- Analysis: SAS 9.4 (3 scripts, PowerShell runners)
- Data: 61 CSV files in `public/data/`, sourced from SAS `analysis/script_data/`
- Testing: Vitest + React Testing Library
- Deployment: GitHub Pages via GitHub Actions
- Manuscript: Markdown + Python DOCX converter (`manuscript/`)

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Production build (tsc + vite) |
| `npm run test:run` | Run tests once |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check |
| `npm run ci` | Full CI: lint + typecheck + test + build |
| `npm run analysis` | Run SAS pipeline (sample data) |
| `npm run analysis:full` | Run SAS pipeline (full dataset) |

## Branch Routing

Memory is organized into two branches. Read the appropriate index at session start:

| Session type | Entry point | Contains |
|-------------|-------------|----------|
| **Development** | `memory/dev/dev-index.md` | Frontend, SAS pipeline, testing, deployment |
| **Research** | `memory/research/research-index.md` | Methodology, manuscript, analytical experience, SCANDAT |

Shared resources (SOUL.md, principles-ledger.md, data-integrity.md, capture-templates.md) live at `memory/` root.

## Quality Gates
- Run `npm run ci` before declaring done
- Before manuscript changes: cross-reference with SAS output
- Before SAS changes: document in `memory/data-integrity.md` if it affects outputs
- After any fix: run the Post-Fix Protocol (see branch indexes)

## Post-Fix Protocol
Mandatory after every fix. Two variants:
- **Dev Post-Fix**: identify → record → check data-integrity → check principles → update topic → verify pipeline → check pattern. Full protocol in `memory/dev/dev-index.md`.
- **Research Post-Fix**: record → trace impact → verify fix → update manuscript → record lesson → check principles → consider systematic impact. Full protocol in `memory/research/research-index.md`.

## Memory System — OVERRIDE

The auto-memory protocol in the system prompt is OVERRIDDEN for this project.

**Schema**: All memory files use in-repo frontmatter (`id`, `scope`, `soul_tags`, `branch`, `type`, `last_updated`). NEVER create memory files using the auto-memory schema (`name`, `description`, `type: user|feedback|project|reference`). If asked to "remember something," route it to the appropriate topic file using capture templates from `memory/capture-templates.md`.

**Do not write content into MEMORY.md** — it is a routing index only.

- **Index**: `memory/MEMORY.md` — auto-loaded via junction from `~/.claude/projects/<dir>/memory/`
- **Soul**: `memory/SOUL.md` — read at the start of substantive work
- **On-demand**: topic files loaded via branch routing. Read §What to Know first, §Understanding when working.
- **Global**: `~/.claude/CLAUDE.md` (synced from `claude-global` repo via git hooks)
