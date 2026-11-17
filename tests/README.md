# Playwright — VFitAI

Existing suite extended for specialized 3D checks; Selenium owns commerce E2E.

From root install dependencies with `npm ci --prefix server`, `npm ci --prefix client`,
`npm ci --prefix tests`, then `node tests/node_modules/@playwright/test/cli.js install chromium`.
Node22 and the owned MongoDB runtime are required; no development DB or real account.
See [environment setup](../qa/docs/environment-setup.md) for optional local mongod.

From `tests/`:

```sh
npm run typecheck
npm test
npm run test:3d
```

Default: six existing smoke/API checks plus six real 3D functional/reliability cases,
one worker, fresh context/reset/clear per test, no retries. 3D uses ANGLE SwiftShader.
Visual is opt-in and uses the approved Windows profile:

```powershell
$env:QA_3D_VISUAL='1'
node node_modules/@playwright/test/cli.js test --project=3d-visual
```

To demonstrate a wrong but valid model, run from root:
`node scripts/qa-3d-diagnostic.cjs`. It verifies one expected pixel mismatch with a
diff and trace, and rejects unrelated failures. The injected fault never runs in
default suites or changes the baseline. The diagnostic report intentionally has
one failed test; wrapper exit0 means the detector was verified, not that the
incorrect model passed.

Reports: `playwright-report/` (HTML), `test-results/` (failure screenshot/trace).
Diagnostic artifacts: root `.runtime/qa3d-diagnostic/`. Open trace with
`node node_modules/@playwright/test/cli.js show-trace <trace.zip>`.
Generated reports are ignored and uploaded by CI for14 days; manifests containing
generated accounts/capabilities are never artifacts. Keep raw reports outside
`test-results/` before another run because Playwright cleans its output directory.

Read [3D scope, oracles and limits](../qa/docs/stage-7-playwright-3d.md),
[approved baseline process](visual-baselines/README.md) and
[bugs/retest](../qa/bug-reports/stage7-3d.md).
