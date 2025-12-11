# SCANDAT ICU Dashboard Refactor Plan

A complete, standalone refactoring plan for migrating a legacy vanilla JavaScript scientific visualization dashboard to React 18 + TypeScript + Vite.

## Quick Start

1. Read `ROADMAP.md` for architectural overview and phase breakdown
2. Execute tickets in dependency order (see Execution Order below)
3. Each ticket in `tickets/` is self-contained with full implementation details

## Contents

```
scandat-refactor-plan/
├── ROADMAP.md                    # Master plan: ADRs, phases, success criteria
└── tickets/
    ├── T-001-project-scaffold.md      # Phase 1: Vite + React + TypeScript setup
    ├── T-002-design-tokens.md         # Phase 1: CSS design system migration
    ├── T-003-type-definitions.md      # Phase 2: TypeScript interfaces
    ├── T-004-data-service.md          # Phase 2: Data loading with caching
    ├── T-005-zustand-store.md         # Phase 3: State management
    ├── T-006-layout-shell.md          # Phase 4: App shell components
    ├── T-007-base-chart.md            # Phase 4: Chart.js wrapper
    ├── T-008-control-components.md    # Phase 4: UI controls
    ├── T-009-main-findings-tab.md     # Phase 5: Main Findings tab
    ├── T-010-rbc-transfusions-tab.md  # Phase 5: RBC Transfusions tab
    ├── T-011-component-factor-effects-tab.md  # Phase 5: Component Factor tab
    ├── T-012-descriptive-statistics-tab.md    # Phase 5: Descriptive Stats tab
    ├── T-013-responsive-accessibility.md      # Phase 6: Responsive + A11y
    ├── T-014-performance-optimization.md      # Phase 6: Performance
    ├── T-015-deployment-configuration.md      # Phase 6: Deployment
    └── T-016-testing-setup.md         # Phase 2: Testing framework
```

## Execution Order

### Phase 1: Foundation (Parallel)
- T-001 + T-002 can run simultaneously

### Phase 2: Data Layer (Sequential + Parallel)
- T-003 → T-004 (sequential)
- T-016 can run parallel with T-003/T-004

### Phase 3: State
- T-005 (depends on T-003)

### Phase 4: Core Components (Parallel)
- T-006, T-007, T-008 can run simultaneously (all depend on T-001, T-002, T-005)

### Phase 5: Tab Implementations (Parallel)
- T-009, T-010, T-011, T-012 can run simultaneously (all depend on Phase 4)

### Phase 6: Polish (Sequential)
- T-013 → T-014 → T-015

## Dependency Graph

```
T-001 ─────────────────┬───────────────────┐
                       │                   │
T-002 ─────────────────┤                   │
                       ▼                   ▼
T-003 ──────► T-004    ├──► T-006 ──┐     T-016
  │                    │            │
  ▼                    │            │
T-005 ◄────────────────┘            │
  │                                 │
  ├──────► T-007 ──────────────────┤
  │                                 │
  └──────► T-008 ──────────────────┘
                                    │
              ┌─────────────────────┤
              │                     │
              ▼                     ▼
           T-009                 T-010
           T-011                 T-012
              │                     │
              └─────────┬───────────┘
                        ▼
                     T-013
                        │
                        ▼
                     T-014
                        │
                        ▼
                     T-015
```

## Estimated Effort

| Phase | Tickets | Effort | Parallelizable |
|-------|---------|--------|----------------|
| 1 - Foundation | T-001, T-002 | 4-6h | Yes (2 agents) |
| 2 - Data Layer | T-003, T-004, T-016 | 8-11h | Partial |
| 3 - State | T-005 | 2-3h | No |
| 4 - Core Components | T-006, T-007, T-008 | 10-13h | Yes (3 agents) |
| 5 - Tab Implementations | T-009-T-012 | 17-21h | Yes (4 agents) |
| 6 - Polish | T-013, T-014, T-015 | 8-11h | Mostly sequential |
| **Total** | 16 tickets | **48-62 hours** | |

**Timeline Estimates:**
- Sequential (1 agent): 8-12 days
- Parallel (4 agents): 3-4 days

## Key Decisions

1. **Vite + React 18 + TypeScript**: Modern tooling with strict types
2. **Zustand**: Lightweight state management (not Redux)
3. **CSS Modules + Custom Properties**: Scoped styles with design tokens
4. **Chart.js 3.9.1**: Retained from legacy (no upgrade)
5. **Client-side CSV caching**: No backend required

## For AI Agents

Each ticket is **standalone** and contains:
- Full context and objective
- Complete code snippets with file paths
- Explicit acceptance criteria
- Implementation notes and gotchas

**Start by reading the specific ticket. Do not read all tickets upfront.**

## Corrections Applied

Based on review feedback, two issues were corrected:

1. **T-004**: Fixed ESM import issue (removed `require()` calls in hooks)
2. **T-016**: Added comprehensive testing setup with Vitest

---

*Generated for SCANDAT ICU Transfusion Dashboard refactor project*