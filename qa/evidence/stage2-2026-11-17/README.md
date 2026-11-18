# Stage 2 evidence — November 17, 2026

Input `4caae89`, branch `qa/stage-2-test-environment`. SHA-256 hashes identify candidate source, configuration, and fixtures.

- `execution-summary.json` records the test environment and overall results.
- `repeat-summary.json` records two backend runs with 130 passes across 13 suites each and two Playwright runs with 6 passes and zero skips each. Run IDs and databases differed. Each browser suite performed 7 resets, including initial seeding and 6 cases. Cleanup stopped services and freed ports.
- `control-summary.json` records reset, clear, stop, health transitions, rejection of occupied ports and invalid capabilities, and credential cleanup. The CLI waits for cleanup before returning success from stop.
- `source-sha256.json` and `asset-sha256.json` identify candidate source and 7 existing GLB assets.
- `raw-log-sha256.json` fingerprints local logs and JSON.

Repeat output is under `.runtime/qa-repeat/1794900303253-9b0229f9/`. The CLI log is `.runtime/stage2/control-check.log`. Keep raw files, runtime manifests containing credentials and capabilities, MongoDB data, traces, and generated reports local. Diagnostic failures and final results are tracked separately. [Findings and retest](../../bug-reports/STAGE2-ENV.md).

Counts are test executions. Coverage against the 150-case plan, Linux/Actions, visual rendering, and live payment remain unverified here. [Setup](../../docs/environment-setup.md) · [Stage report](../../docs/stage-2-test-environment.md) · [Fixture contract](../../test-data/README.md).
