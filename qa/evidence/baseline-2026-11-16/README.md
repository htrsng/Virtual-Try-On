# Baseline evidence — November 16, 2026

- `execution-summary.json` records commands, UTC timestamps, environment, exit codes, results, and limits. Display dates use Asia/Saigon.
- `diagnostics.json` contains TypeScript and ESLint diagnostics and Jest assertion results. Messages use `<repo>` in place of the workspace path.
- `source-sha256.json` records hashes of 213 application, test, launcher, and workflow files. It excludes environment files, dependencies, 3D binaries, database files, and generated output. It identifies the measured source snapshot.
- `api-endpoints.csv` lists 71 route declarations from the main server and AI router. Guard entries describe declared middleware.
- `raw-log-sha256.json` records local raw log hashes.
- `coursework-component-check.json` records a jsdom component rerun after the archived runner’s client path was updated.

Playwright exited 1 and was classified BLOCKED because the browser had yet to launch. The baseline records this as an environment issue. Raw logs remain in the local Git-ignored `.runtime/` directory.
