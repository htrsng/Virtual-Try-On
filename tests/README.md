# Web and 3D testing with Playwright

| Scope | Representative test |
| --- | --- |
| Shopping cart | [Select a product and reach checkout summary](e2e/checkout-journey.spec.ts) |
| Fitting room | [Geometry changes, camera rotation, animation, and GLB recovery](e2e/tryon-3d.spec.ts) |
| Compatibility and keyboard behavior | [Browsers and viewports](e2e/compatibility.spec.ts) · [axe, focus, and Escape](e2e/accessibility.spec.ts) |
| Compiled bundle | [Build assets and UI through Vite preview](e2e/production.spec.ts) |

## Run the tests

The suite uses TypeScript and Playwright 1.60.0 on Node.js 22. The QA launcher manages a temporary MongoDB instance. Install dependencies as described in the [root README](../README.md), then install Chromium and Firefox from the repository root.

```sh
node tests/node_modules/@playwright/test/cli.js install chromium firefox
```

Run the following from `tests/`.

```sh
npm run typecheck
npm test
npm run test:3d
```

`npm test` runs 12 cases: 6 web/API checks and 6 3D checks. The checkout case ends at the order summary. The 3D checks use real GLBs. Playwright starts an isolated QA environment, resets fixtures before each case, and cleans up after the suite. The suite uses one worker because cases share the same environment.

## Run individual groups

| Group | Command or guide |
| --- | --- |
| Browser compatibility | From `tests/`, run `node node_modules/@playwright/test/cli.js test --config=playwright.compat.config.ts`. |
| Accessibility | From the repository root, use the CI runner with `playwright-accessibility`. |
| Compiled bundle | From the repository root, use the CI runner with `playwright-production`. It builds the bundle and starts Vite preview. |
| WebGL image comparison | Follow the [Windows render profile and baseline guide](visual-baselines/README.md). |

For example, run the accessibility group with the same runner as CI.

```sh
node scripts/ci/run.cjs init playwright-accessibility
node scripts/ci/run.cjs run playwright-accessibility
node scripts/ci/run.cjs finalize playwright-accessibility
```

Compatibility checks run in desktop Chromium and Firefox, plus Chromium at 768 × 1024 tablet and 390 × 844 mobile viewports. Accessibility checks use axe and keyboard scenarios. Safari, screen readers, and physical devices are tracked in the [manual acceptance checklist](../qa/docs/manual-acceptance-checklist.md).

## Investigate failures

Find the default HTML report in `tests/playwright-report/` and failure screenshots and traces in `tests/test-results/`. From `tests/`, open a trace with `node node_modules/@playwright/test/cli.js show-trace <trace.zip>`. Copy results you want to keep outside `test-results/` before rerunning.

From the repository root, run `node scripts/qa-3d-diagnostic.cjs` to check that image comparison detects a valid GLB for the wrong item. The underlying test should produce a pixel diff. The script returns exit code 0 only after confirming the expected difference. Results are written to `.runtime/qa3d-diagnostic/`. [3D test design and limitations](../qa/docs/stage-7-playwright-3d.md).

## Find tests and results

- `e2e/` contains web, accessibility, and 3D scenarios. `fixtures.ts` manages test data, and `viewer-fixtures.ts` supports renderer checks.
- `playwright.config.ts` runs the default suite. The `playwright.*.config.ts` files select additional groups.

On November 18, 2026, the local run recorded 12/12 default, 20/20 compatibility, 21/21 accessibility, 4/4 production preview, and 1/1 Windows visual checks passing. Browser groups repeat some cases across configurations. [Results and counting method](../qa/docs/test-summary.md).
