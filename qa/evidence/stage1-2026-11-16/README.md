# Stage 1 evidence — November 16, 2026

Input commit `e751a46`, application baseline `3d61097`, branch `qa/stage-1-backend-p0`. The delivery commit contains `source-sha256.json`, which identifies the candidate through changed application, configuration, test, and lockfile hashes.

- `execution-summary.json` records final Jest JSON counts, UI safety checks, and syntax checks.
- `source-sha256.json` records source fingerprints and excludes `.env` and database data.
- `raw-log-sha256.json` fingerprints local logs and JSON.

Raw files remain under `.runtime/stage1/`. `before.log` records 5 expected failures. `pricing-before.log` records the old source saving a total of 1. `backend-final.log` and `jest-results.json` record 120 passes across 12 suites. `frontend-payment.log` records 2 passes, and `jsx-syntax.log` records 8 files with zero diagnostics. The pricing probe was added separately in a local clone of the older source. Interim failures remain separate from baseline and final runs.

The recorded scope covers backend, UI safety, and syntax checks. Full frontend, E2E, 3D, live payment, email, AI, and GitHub Actions remain outside these results. Keep generated reports, databases, downloaded binaries, and long raw logs outside Git. [Environment setup](../../docs/environment-setup.md) · [Stage report](../../docs/stage-1-backend-report.md).
