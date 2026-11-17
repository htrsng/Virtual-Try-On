# CI findings — Stage 8

## CI-STATIC-01 — Build is not passing

Confirmed Failed, application/static-check backlog. Full `npm run build` stops at
109 TypeScript diagnostics, before Vite bundle. No tsc bypass/noEmit suppression
added. Error details and SHA/environment are in the build artifact run.log and
summary.json; independent unit/API/browser jobs still run. Not classified as infra.

## CI-STATIC-02 — Lint is not passing

Confirmed Failed:213 errors/14 warnings with the current TS/TSX ESLint config.
Full eslint.json is preserved; errors are not downgraded to warnings or filtered
against a baseline allowance. JS/JSX-wide lint expansion remains separate work.

## CI reporting controls

Old reports cannot substitute for a failed startup. CI output is suite-scoped,
Maven evidence must be newer than the run, and expected wrong-model diagnostics
remove stale report/summary before execution. Negative-control output is isolated
from positive visual output. XML escaping strips terminal controls to keep failure
reports parseable. These controls are tested without creating fake business cases.

Remote defects/infrastructure failures, if observed, are audited per GitHub job/step
and linked in the PR description. These two static failures are not silently closed
just because the CI architecture and other suites execute correctly.
