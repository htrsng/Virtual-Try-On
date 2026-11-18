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

## Compatibility and keyboard checks (Stage 9)

From `tests/`: install pinned browsers with
`node node_modules/@playwright/test/cli.js install chromium firefox`, then run
`node node_modules/@playwright/test/cli.js test --config=playwright.compat.config.ts`.
Five scenarios run across desktop Chromium/Firefox, tablet768x1024 Chromium and
mobile390x844 Chromium:20 invocations. Mobile is emulation, not physical-device
coverage. WebKit/Safari and screen-reader checks remain Not Run.

The opt-in matrix reuses catalog/checkout cases; it does not duplicate them in the
default12-test suite or compare Firefox against Windows WebGL baselines. The
checkout case stops at the summary, not order submission/payment. Keyboard tests
check login/registration controls and password toggles, not full WCAG conformance.

For SHA-stamped JUnit/HTML/JSON, run `node scripts/ci/run.cjs init playwright-compat`,
`run playwright-compat`, then `finalize playwright-compat` from root. Full regression
CI includes this matrix; manual/scheduled remote execution requires default-branch
availability. [Manual testing](../qa/docs/manual-testing.md) records visual review
findings beyond the width and navigation assertions.

## Accessibility, production and new-platform visual candidates

From root, use the CI runner lifecycle init/run/finalize for playwright-accessibility
(21 invocations: seven scenarios across three profiles) and playwright-production
(four checks against the compiled preview bundle). Accessibility includes home,
login, product, authenticated cart/checkout, real Tab/focus, support Escape and CSS
zoom200. Full native axe JSON retains incomplete findings; no rules are disabled.
This is not human NVDA/VoiceOver, native-browser zoom, physical-device testing or
complete WCAG certification. [User checklist](../qa/docs/manual-acceptance-checklist.md).

The default12 suite stays separate; extra configs are selected explicitly and do
not inflate its count. Production smoke rebuilds with same-origin API resolution,
starts owned QA preview, checks compiled assets/no dev client and reuses commerce
checks. It does not deploy an application or exercise real payment/provider success.

Linux functional CI separately runs playwright.candidates.config.ts and attaches
front/left native WebGL PNGs plus environment with approved=false. Export is not a
pixel-comparison verdict. Reports are nested under visual-candidates/ to preserve
functional6 counts. Approved Windows PNGs stay unchanged; do not promote/copy a
new platform without inspecting its own images and recording explicit approval.
