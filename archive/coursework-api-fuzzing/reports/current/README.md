# Supplemental QA evidence — November 15, 2026

This snapshot supplements the baseline.

- `replay/` records 20 failing cases, one representative scenario per case, and 2 attempts on fresh state for each. All 40 failures recurred. The runner checked the input report hash and source manifest before executing.
- `frontend/` records 14 passing component checks, failed typecheck and lint, and bundle status NOT_RUN. The snapshot includes scope, source hashes, JUnit, and logs.
- `reporting-regression.txt` records 9 passing reporting and replay contract tests.
- `quality-schema-regression.txt` records 4 passing schema-advisory checks.
- `fuzz-quality/report.json` records 28 mutated HTTP inputs with seed 7. Schema advisory rates and full business validity are separate measurements.
- `snapshot-sha256.json` records hashes of curated artifacts.

The runs used Windows, Python 3.13.2, and Node.js 22.15.0. Frontend checks ran outside the sandbox so esbuild and workers could spawn. These are local workspace results, identified by suite-specific source hashes.

Absolute paths refer to the original machine. Use the [evidence index](../../qa/evidence-index.md) to find reports and follow the coursework README to rerun into a fresh output directory. Production API, browser E2E, WebGL, and full frontend checks are outside the recorded results.
