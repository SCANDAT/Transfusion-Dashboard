---
id: dev-index
scope: "Dev branch entry point — frontend, SAS pipeline, testing, deployment, Post-Fix Protocol"
soul_tags: [Rigor, Uniformity, Guardianship]
branch: dev
type: branch-index
last_updated: "2026-03-24"
---
# Dev Branch Index

Entry point for development sessions. Routes to dev topic files (frontend patterns, SAS pipeline,
testing) and shared root files (data integrity, principles). Building conventions and Post-Fix
Protocol live here — read before modifying code.

---

## What to Know

- Dashboard is a React 18 SPA that displays pre-computed SAS results — zero runtime statistical computation
- SAS pipeline: 3 scripts via PowerShell runners, output to CSV, manually copied to `public/data/`
- Single Zustand store, Chart.js 4 for visualization, lazy-loaded tabs, CSS custom properties for theming
- 5 test files (cache, csvParser, dataService, dashboardStore, guards) — coverage is basic
- Post-Fix Protocol mandatory after every fix — dev variant traces SAS → CSV → dashboard

---

## Routing Table

| If touching... | Read first |
|---|---|
| `src/components/`, UI, tabs | [frontend-patterns.md](frontend-patterns.md) |
| `src/services/`, data loading, cache | [frontend-patterns.md](frontend-patterns.md) §Data Flow |
| `src/stores/`, Zustand | [frontend-patterns.md](frontend-patterns.md) §State Management |
| `src/types/`, TypeScript types | [frontend-patterns.md](frontend-patterns.md) §Type System |
| Chart.js, chart config, exports | [frontend-patterns.md](frontend-patterns.md) §Chart.js Patterns |
| `sas_code/*.sas` | [sas-pipeline.md](sas-pipeline.md) + [../data-integrity.md](../data-integrity.md) |
| `sas_code/*.ps1`, PowerShell runners | [sas-pipeline.md](sas-pipeline.md) §PowerShell Runners |
| `*.test.*`, Vitest | [testing-patterns.md](testing-patterns.md) |
| `.github/workflows/`, CI/CD | Dev-index §Deployment (below) |
| `package.json`, dependencies | Dev-index §Conventions (below) |
| Data accuracy, CSV bugs | [../data-integrity.md](../data-integrity.md) |
| Metric formulas, model specs | [../research/methodology.md](../research/methodology.md) |
| Architecture deep-dive | [../../docs/architecture.md](../../docs/architecture.md) |
| Principles reference | [../principles-ledger.md](../principles-ledger.md) |

**Reading protocol**: Read each topic file's §What to Know section first (~8-10 lines). Consult §Understanding only when actively working in that area.

---

## Conventions

- **Path aliases**: `@/` → `src/`, plus `@components`, `@hooks`, `@services`, `@stores`, `@types`, `@styles`
- **Component structure**: Each tab is a directory in `src/components/tabs/` with `index.tsx` entry
- **State management**: Single Zustand store (`dashboardStore.ts`). Selectors as functions. `useShallow` for multi-field. Persist only theme + activeTab
- **Data loading**: `dataService.ts` is the single source of all data fetching. Uses `DataCache` with TTL. `fetchCSVWithFallback` handles case sensitivity
- **Error handling**: `ErrorBoundary` wraps each tab. `ErrorToast` for transient errors
- **Lazy loading**: All 5 tab components are `React.lazy()` with `Suspense` fallback
- **Use `py` not `python`** (Windows/MINGW environment)
- **CSV is the contract**: SAS outputs CSV, dashboard consumes CSV, no intermediate formats

---

## Quality Gates

Before committing:
1. `npm run lint` — zero warnings
2. `npm run typecheck` — zero errors (or `npx tsc --noEmit`)
3. `npm run test:run` — all passing
4. `npm run build` — successful production build
5. Manual: check `npm run dev` for visual regressions

Before modifying SAS:
1. Run `npm run analysis` (sample data) to verify
2. Compare CSV output counts with previous run
3. Verify dashboard still loads with new CSVs
4. Update `data-integrity.md` if the change affects pipeline outputs

---

## Post-Fix Protocol (Dev)

After fixing any bug or completing any feature:

1. **Identify** the root cause. Was it a data issue, a UI bug, a type error, a SAS problem?
2. **Record** the fix using the appropriate capture template (Decision, Data Discovery, or Convention) from [../capture-templates.md](../capture-templates.md)
3. **Check** [../data-integrity.md](../data-integrity.md) — does this fix reveal or resolve a cataloged disease?
4. **Check** [../principles-ledger.md](../principles-ledger.md) — does this fix suggest a new principle?
5. **Update** the relevant topic file's Understanding section if the fix changes how something works
6. **Verify** the data flow: SAS output → CSV → dashboard display. Does the fix affect any layer?
7. **Consider** whether this fix reveals a pattern that applies elsewhere (same bug in multiple places)

This protocol is not optional. Skipping it means the same disease WILL recur in a different context, in a different session, with no memory of the fix.

---

## Deployment

- CI runs on push to `main` and on PRs to `main` (GitHub Actions)
- GitHub Pages deployment triggers on push to `main` only
- `VITE_BASE_PATH` set to `/Transfusion-Dashboard/` for GitHub Pages
- Netlify and Vercel configs exist (`netlify.toml`, `vercel.json`) but GitHub Pages is primary
- Build output in `dist/` with vendor chunk splitting (react, charts, data, state)

---

## System Status (2026-03-24)

Honest assessment of the dev layer:

### What works well

| Capability | Status | Notes |
|-----------|--------|-------|
| Dashboard UI | Solid | 5 tabs, lazy loading, dark/light theme, responsive |
| Data pipeline (SAS → CSV → display) | Solid | 61 CSV files, fetchCSVWithFallback |
| Chart visualization | Solid | Chart.js 4, vertical line plugin, PNG/CSV export |
| State management | Solid | Single Zustand store, persist middleware |
| GitHub Pages deployment | Solid | Automated via GitHub Actions |

### What's fragile or incomplete

| Capability | Status | Issue |
|-----------|--------|-------|
| Test coverage | Basic | 5 test files, no component/chart/E2E tests |
| SAS → public/data/ sync | Manual | Copy step not automated |
| Accessibility | Minimal | Keyboard navigation hook exists, no a11y audit |
| LOESS UI | Fragile | Span selector may not exist in all tabs |
| `nul` file in repo root | Artifact | Windows artifact, should be removed |

### Priority sequencing

**Now**: Memory system initialization. Establish conventions before expanding functionality.

**Next**: Automate CSV sync (`npm run sync-data`). Expand test coverage for data transformation functions.

**Then**: Accessibility audit. Component-level tests for chart rendering.

---

## See Also

- [../data-integrity.md](../data-integrity.md) — disease catalog
- [../principles-ledger.md](../principles-ledger.md) — soul-tagged rules
- [../research/methodology.md](../research/methodology.md) — model specifications
- [../../docs/architecture.md](../../docs/architecture.md) — system architecture
