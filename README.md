# VFitAI - Full-Stack & 3D QA Automation

React / TypeScript / Three.js / Express / MongoDB
Selenium / Java / TestNG / Maven / POM / Playwright

E-commerce and 3D virtual try-on with UI-to-API-to-MongoDB verification, isolated
synthetic data, reviewed visual baselines and CI failure evidence.
**Development in progress: lint/build gates still fail; not production-ready.**

## Review the portfolio

- [Test Summary](qa/docs/test-summary.md): verified results, environment, CI links and limitations.
- [Feature Inventory](qa/docs/feature-inventory.md), [RTM](qa/docs/rtm.md), [Bug Register](qa/bug-reports/bug-register.md).
- [Selenium framework](qa/selenium-java/README.md): fresh driver per test, explicit waits, POM, failure screenshots.
- [Playwright 3D](qa/docs/stage-7-playwright-3d.md): mounted GLB/state, camera, resource lifecycle, visual comparison and wrong-model detector.
- [CI/reporting](qa/docs/stage-8-ci-quality-gates.md): SHA/environment, JUnit/HTML, screenshots and traces.
- [Manual/exploratory](qa/docs/manual-testing.md) and [Stage 9 review](qa/docs/stage-9-portfolio.md).

## Verified status

[PR #4](https://github.com/htrsng/Virtual-Try-On/pull/4), source `8d6b8b0`, verified
backend128, frontend25, helpers14, policy12, Selenium smoke5, 3D functional6 and
Windows visual1 passing on GitHub. Lint failed213 errors/14 warnings; build failed109
TypeScript diagnostics. These are **pre-refactor** results. Current Stage 9 results
are maintained separately in [Test Summary](qa/docs/test-summary.md).

Online payment has no provider (API503); social login and password recovery have
no complete flow. Live Gemini/email integrations are not E2E-verified. Browser
repeats are execution counts, not new business cases;150 cases remains a target.

## Run smoke from a clean clone

Requires Node22, Java17, Maven3.9+, and Chrome or Edge. The QA launcher creates its
own MongoDB replica set; no real account, development database or application
`.env` is needed. First run needs network for dependencies, MongoDB8.2.6 and drivers.

```sh
npm ci --prefix server
npm ci --prefix client
npm ci --prefix tests
node scripts/qa-selenium.cjs -Dbrowser=chrome -Dgroups=smoke
```

Run browser suites sequentially (default QA ports are shared):

```sh
node tests/node_modules/@playwright/test/cli.js install chromium firefox
npm --prefix tests test
node scripts/qa-selenium.cjs -Dbrowser=chrome -Dgroups=regression
node scripts/ci/run.cjs init playwright-compat
node scripts/ci/run.cjs run playwright-compat
node scripts/ci/run.cjs finalize playwright-compat
```

Compatibility covers desktop Chromium/Firefox plus tablet768 and mobile390 Chromium.
Device emulation does not replace physical devices/Safari. Reviewed visual baselines
apply only to the fixed Windows render profile; never auto-update them to hide a diff.
See [browser test guide](tests/README.md) for visual and diagnostic commands.

```sh
npm --prefix client run test:ci
npm --prefix server test
npm --prefix client run lint
npm --prefix client run build
```

Generated reports: `.runtime/`, `tests/playwright-report/`,
`qa/selenium-java/target/` (ignored). CI artifacts retain14 days; open the runs in
Test Summary to download JUnit/HTML/traces. Never upload QA environment manifests,
which contain synthetic credentials. Only curated samples/summaries are committed.

## Application setup and structure

[Environment setup](qa/docs/environment-setup.md) documents MongoDB replica sets,
JWT secret, `.env.example`, UI5173/API3000 and Windows `scripts/start-web.ps1`.
QA uses API3300/UI55173 and a temporary database; readiness checks precede tests.

```text
client/           React/TypeScript/Three.js application and component tests
server/           Routes/controllers, business logic, models and API tests
tests/            Existing Playwright functional, 3D, visual and compatibility tests
qa/docs/          Strategy, inventory, cases, RTM, manual testing and summary
qa/selenium-java/ Maven/TestNG/POM smoke and business regression
qa/test-data/     Synthetic fixtures and lifecycle contract
qa/bug-reports/   Confirmed findings, fixes and retests
qa/evidence/      Curated summaries and sample evidence
scripts/          Owned QA lifecycle and CI reporting
.github/          Scoped workflows and reusable job
doc/              Application and restoration documentation
archive/          Historical coursework
```

[Stage 9 report](qa/docs/stage-9-portfolio.md) separates Development Fix/refactor
from QA work. [Roadmap](qa/docs/implementation-roadmap.md) keeps dependencies and
future scope. Earlier baseline reports are historical, not current status.

API fuzzing remains in the [Coursework Archive](archive/coursework-api-fuzzing/README.md)
and is not counted as VFitAI backend coverage.
