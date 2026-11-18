# Existing-test audit evidence — November 17, 2026

Input `1914105`, branch `qa/stage-4-existing-test-audit`. Source hashes identify the final candidate. [Existing-test audit](../../docs/existing-test-audit.md).

- `execution-summary.json` records frontend before and after results, backend consolidation, static check failures, and legacy runs. The 14 component cases are included in the 21 frontend cases.
- `test-file-inventory.csv` records 32 automated test files with runner, layer, count, and status. It includes 22 application-related files, including two helper files in the legacy location, and 10 archived Python files. Infrastructure and manual designs are excluded.
- `coverage-summary.json` records V8 coverage for 130 frontend and 19 backend files in the declared scope. Native subprocess runs are excluded.
- `browser-repeat-summary.json` records two runs with 6 passes and zero skips each. Each run reset fixtures 7 times, used a separate owned database, and released its ports at cleanup.
- `ci-job-audit.json` records 6 reviewed job logs with URLs, conclusions, failed and skipped steps, causes, and raw-log hashes. The historical PR had head `1914105` and checked out merge commit `fe571b1`. The candidate workflow fix had local evidence only at this stage.
- `source-sha256.json` and `raw-log-sha256.json` fingerprint candidate source, toolchain, and local output. Raw files remain under `.runtime/stage4/`, `.runtime/ci/`, and `.runtime/coverage/`. The repeat output is under `.runtime/qa-repeat/1794902786997-a2a6fa3a/`.

Raw CI logs, credential helper data, signed links, generated reports, screenshots, traces, and runtime manifests remain outside Git. The metadata excludes tokens. The build recorded 109 diagnostics and lint recorded 208 errors and 14 warnings. Both checks failed. The full archived fuzz campaign, visual rendering, and live payment were outside this run.
