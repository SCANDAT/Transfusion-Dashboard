---
id: dev-testing-patterns
scope: Test infrastructure, coverage, and conventions for the SCANDAT ICU dashboard
soul_tags:
  - Rigor
  - Guardianship
  - Vigilance
  - Reproducibility
  - Honesty
  - Understanding
branch: dev
type: topic
last_updated: "2026-03-24"
---

# Testing Patterns

## What to Know

The project uses Vitest as its test runner with React Testing Library and jsdom for DOM simulation. There are currently five test files covering core service and store logic: cache.test.ts, csvParser.test.ts, dataService.test.ts, dashboardStore.test.ts, and guards.test.ts. Tests are colocated in __tests__/ directories next to the modules they test. Coverage is basic, concentrated on data-layer utilities and the Zustand store, with no component rendering tests and no end-to-end tests. MSW 2.x (Mock Service Worker) is available as a dependency for intercepting network requests in tests. The test suite runs fast and is suitable for pre-commit checks. Adding tests for new features or bug fixes is expected, especially for anything touching data parsing or transformation.

## Understanding

### Test Structure

The Vitest configuration lives in vitest.config.ts at the project root. It extends the Vite config, specifying jsdom as the test environment and configuring path aliases (@/ to src/) so imports in test files resolve identically to production code. Global test setup files, if any, are referenced in the config's setupFiles array.

Test files follow the naming convention {module}.test.ts and reside in __tests__/ directories adjacent to the source modules they cover. For example, src/services/__tests__/cache.test.ts tests src/services/cache.ts. Each test file uses describe blocks to group tests by function or behavior category, and individual tests use the it('should ...') naming convention to describe expected behavior in plain English.

Tests run via the `vitest` command (or `vitest run` for CI-style single pass). The `--reporter=verbose` flag is useful during development for full test-name output. Coverage reports can be generated with `vitest --coverage` but are not currently enforced in CI.

### What Is Tested

**cache.test.ts**: Validates the DataCache module's TTL behavior. Tests confirm that cached entries are returned within the TTL window, that expired entries are evicted and return undefined, and that the cache correctly handles clearing and overwriting. Edge cases include zero-TTL behavior and concurrent access patterns.

**csvParser.test.ts**: Tests the CSV parsing wrapper around PapaParse. Covers well-formed input, empty files, files with only headers, malformed rows (missing columns, extra columns, unquoted commas), and numeric type coercion. Ensures that the parser returns typed arrays matching the expected row interfaces.

**dataService.test.ts**: Tests the data-loading functions including fetchCSVWithFallback behavior. Uses MSW to mock HTTP responses, verifying that successful fetches parse correctly, that 404 responses trigger the fallback path (returning empty arrays), and that network errors are handled gracefully. Also tests preloadData sequencing and loadVizIndex parsing.

**dashboardStore.test.ts**: Exercises the Zustand store's state transitions. Tests cover setting activeTab, toggling theme, updating selected parameters, and the resetStore action. Verifies that persist middleware correctly partializes (only theme and activeTab survive a simulated reload). Uses Zustand's vanilla API for direct testing without React rendering.

**guards.test.ts**: Tests runtime type guard functions that validate data shapes at ingestion boundaries. These guards check whether parsed CSV rows conform to expected interfaces before the data propagates into the chart layer. Tests cover valid objects, objects with missing required fields, objects with wrong types, and null/undefined inputs.

### What Is Not Tested

**Component rendering**: No test file mounts a React component. Tab components, controls, charts, and layout elements have zero render-test coverage. Regressions in JSX structure, conditional rendering, or prop wiring are not caught by the test suite.

**Chart output**: Chart.js canvas rendering is not tested. There are no visual regression tests or snapshot tests for chart appearance. The prepareChartData transformation is partially covered via data-service tests, but the actual Chart.js dataset configuration and plugin behavior (e.g., verticalLinePlugin) are untested.

**SAS pipeline behavior**: The SAS scripts have no automated tests. Correctness of statistical output is validated manually by the research team. There are no integration tests that verify SAS CSV output matches the frontend's expected column schemas.

**Data-display integration**: No test verifies the full path from CSV fetch through parsing, transformation, and rendering in a chart or table. A column rename in a SAS script that breaks a frontend type mapping would not be caught until manual inspection.

**Accessibility**: No axe-core or similar accessibility audit runs in the test suite. Screen reader behavior, keyboard navigation, and ARIA attribute correctness are untested.

**End-to-end**: No Playwright, Cypress, or similar E2E framework is configured. There are no tests that load the full application in a browser and interact with it.

### Testing Conventions

**Describe blocks** group tests by the function or module under test. A single describe block per exported function is the norm, with nested describe blocks for sub-categories when a function has multiple code paths.

**Test naming** uses `it('should ...')` phrasing that reads as a specification: `it('should return cached value within TTL')`, `it('should return empty array on 404')`. Avoid vague names like `it('works')`.

**MSW handlers** are defined per test file (not globally) using MSW 2.x's `http.get()` / `http.post()` syntax. Handlers are registered in a `beforeAll` block via `server.listen()` and cleaned up in `afterAll` via `server.close()`. Per-test overrides use `server.use()` within individual it blocks.

**Data transformations** are tested independently from fetch logic. If a function parses CSV text into typed objects, test the parsing with raw string input rather than mocking an HTTP response. Reserve MSW for tests that specifically exercise the fetch-parse-cache pipeline.

**Assertions** use Vitest's expect with standard matchers (toBe, toEqual, toHaveLength, toBeUndefined, toThrow). Deep equality checks use toEqual for objects and arrays. For partial matching of large objects, toMatchObject is preferred.

### Adding Tests

When adding a new feature or fixing a bug, include tests that cover the changed behavior. The guiding principle is that data-integrity code (parsing, transformation, type guards, cache logic) should have thorough unit tests, while UI-layer tests are a lower but growing priority.

**For bug fixes**: Write a regression test that reproduces the bug's conditions before applying the fix. The test should fail on the old code and pass on the new code. This is especially important for data-parsing bugs where a malformed CSV row caused silent data loss.

**For new data flows**: If a new CSV file type is introduced (new SAS output), add test cases to csvParser and dataService that cover the new column schema. Add a type guard for the new row shape and test it in guards.test.ts.

**For new components**: At minimum, add a smoke-render test using React Testing Library's render function to verify the component mounts without throwing. Interaction tests (clicking buttons, changing selectors) are encouraged but not yet enforced.

**For store changes**: Any new action or state field in dashboardStore should have a corresponding test in dashboardStore.test.ts verifying the state transition and ensuring persist partialize still excludes transient fields.
