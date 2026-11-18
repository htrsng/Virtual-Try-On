# VFitAI — 3D Virtual Try-On and QA Automation

VFitAI is a clothing storefront with a 3D fitting room. Shoppers can browse products, select sizes, and place cash-on-delivery (COD) orders. The test suite focuses on order totals and persistence, access control, and fitting-room behavior when shoppers change sizes or a model fails to load.

[![API tests](https://github.com/htrsng/Virtual-Try-On/actions/workflows/backend-tests.yml/badge.svg?branch=main)](https://github.com/htrsng/Virtual-Try-On/actions/workflows/backend-tests.yml)
[![Selenium smoke tests](https://github.com/htrsng/Virtual-Try-On/actions/workflows/selenium-smoke.yml/badge.svg?event=pull_request)](https://github.com/htrsng/Virtual-Try-On/actions/workflows/selenium-smoke.yml)
[![Playwright and 3D tests](https://github.com/htrsng/Virtual-Try-On/actions/workflows/playwright-3d.yml/badge.svg?event=pull_request)](https://github.com/htrsng/Virtual-Try-On/actions/workflows/playwright-3d.yml)

## Test coverage by feature

| Feature | What the tests cover |
| --- | --- |
| Authentication and authorization | Valid and invalid logins, expired sessions, customer and administrator permissions. |
| Products and cart | Search, category filtering, product pages, size selection, quantity changes, and item removal. |
| Checkout, orders, and inventory | Server-calculated pricing and fees, coupons, COD, cancellations, order transitions, and concurrent purchases of the last unit. |
| 3D virtual try-on | GLB loading, geometry changes by size, camera rotation and zoom, animation, renderer resources, and load-error recovery. |
| AI outfit recommendations | Vitest uses a mocked service to check pending and error states during recommendation refinement. The outfit API has yet to be verified against live Gemini. |
| Data integrity | MongoDB persistence, owner-scoped access, and stock preservation when checkout is rejected. |

Jest and Supertest exercise the API and persisted state. Vitest covers component behavior. Selenium drives purchase flows in a browser, and Playwright checks web flows and the 3D renderer.

## Test execution summary

Local results from **November 18, 2026** on Windows with Node.js 22.15.0, Java 17, and MongoDB 8.2.6. The run used base commit `b0fc753` plus local changes documented by source hashes. [Execution evidence](qa/evidence/quality-completion-2026-11-18/execution-summary.json).

| Test layer | Local result | Guide |
| --- | --- | --- |
| API and integration — Jest/Supertest | 134/134 passed | [API tests](server/tests/README.md) |
| Frontend — Vitest/Testing Library | 38/38 passed | [Test summary](qa/docs/test-summary.md) |
| Business E2E — Selenium/TestNG | 22/22 passed, including 5 smoke instances | [Selenium](qa/selenium-java/README.md) |
| Web and 3D — Playwright | 12/12 default tests passed, including 6 WebGL cases. The Windows visual check also passed (1/1). | [Playwright](tests/README.md) · [Visual baselines](tests/visual-baselines/README.md) |
| Manual | 8 cases designed. Physical-device acceptance is pending. | [Acceptance checklist](qa/docs/manual-acceptance-checklist.md) |

The **217 automated test instances** in the catalog break down into 134 Jest, 38 Vitest, 22 Selenium, and 23 Playwright instances. Each parameterized data row counts separately. Playwright cases repeated across browsers or configurations are counted once by file and test title. The summary lists compatibility, accessibility, and production-preview executions separately. [Automated test catalog](qa/docs/automated-test-catalog.csv) · [Test summary](qa/docs/test-summary.md).

**GitHub Actions** reports results by revision. For example, PR #7 recorded 13 passing checks for commit `360e518`. The badges link to each workflow’s run history. [PR #7 checks](https://github.com/htrsng/Virtual-Try-On/pull/7/checks).

## Three representative QA checks

- **Place a COD order through the UI.** Selenium selects a product and submits the order, then reads it back through the API to verify the total and inventory after purchase. [Selenium test](qa/selenium-java/src/test/java/com/vfitai/qa/tests/BusinessE2ETests.java#L47) · [E2E evidence](qa/docs/stage-6-business-e2e.md).
- **Handle two shoppers competing for the last unit.** Jest sends two requests concurrently and checks that exactly one order is created and stock reaches zero. [Checkout test](server/tests/checkout.test.js#L58) · [Backend report](qa/docs/stage-1-backend-report.md).
- **Change sizes and recover from a model load failure.** Playwright checks geometry, camera movement, animation, and recovery after a GLB returns HTTP 404. A separate diagnostic confirms that the image comparison detects a valid GLB for the wrong item. [WebGL tests](tests/e2e/tryon-3d.spec.ts) · [3D evidence](qa/docs/stage-7-playwright-3d.md).

## QA documentation and evidence

| What to look up | Where to find it |
| --- | --- |
| Test strategy and requirements coverage | [Test Strategy](qa/docs/test-strategy.md) · [Traceability Matrix](qa/docs/rtm.md) |
| Results, environment, and execution evidence | [Test Summary](qa/docs/test-summary.md) · [Local evidence](qa/evidence/quality-completion-2026-11-18/) |
| Confirmed defects and retests | [Bug Register](qa/bug-reports/bug-register.md) |
| CI run history and artifacts | [GitHub Actions](https://github.com/htrsng/Virtual-Try-On/actions) · [CI guide](qa/docs/stage-8-ci-quality-gates.md) |

## Run the application and tests

Use Node.js 22 and npm. After cloning, run these commands from the repository root.

```sh
npm ci --prefix server
npm ci --prefix client
npm ci --prefix tests
```

For application development, follow the [MongoDB and environment setup guide](qa/docs/environment-setup.md). The development UI defaults to port `5173` and the API to `3000`.

The QA environment starts a temporary local MongoDB replica set and creates test accounts. The test commands require neither a MongoDB Atlas URI nor `server/.env`. The first run may need network access to download MongoDB, browsers, or drivers.

```sh
npm --prefix server test
npm --prefix client run test:ci
node tests/node_modules/@playwright/test/cli.js install chromium
npm --prefix tests test
```

Selenium also requires Java 17, Maven 3.9+, and Chrome or Edge.

```sh
node scripts/qa-selenium.cjs -Dbrowser=chrome -Dgroups=smoke
```

Run Playwright and Selenium one at a time when using the default QA ports (`3300` for the API and `55173` for the UI). See the [Selenium guide](qa/selenium-java/README.md) and [Playwright guide](tests/README.md) for regression runs, port overrides, and reports.

Local results are stored under `.runtime/`, `tests/playwright-report/`, or `qa/selenium-java/target/`. GitHub Actions retains artifacts for 14 days. Keep the run’s `environment.json` local because it contains test credentials.

## Repository layout

| Directory | Contents |
| --- | --- |
| `client/` | Storefront UI, 3D fitting room, and Vitest tests |
| `server/` | API, business logic, MongoDB models, and Jest/Supertest tests |
| `tests/` | Playwright web, browser, accessibility, and 3D checks |
| `qa/selenium-java/` | Selenium/TestNG coverage for login, cart, checkout, and order management |
| `qa/` | Fixtures, test cases, results, and bug reports |
| `scripts/`, `.github/workflows/` | Test environment launchers, CI jobs, and reports |
| `doc/` | Application documentation and UI screenshots |
| [`archive/coursework-api-fuzzing/`](archive/coursework-api-fuzzing/README.md) | API fuzzing coursework against a separate Express target, with its own results |

## Known limitations

- Online payments have no configured provider. Social login and password recovery are incomplete.
- AI UI tests use a mocked service. Live Gemini and email integrations have yet to be verified end to end.
- Mobile browser checks use emulated viewports. Safari/iOS, physical devices, and screen readers remain in the [acceptance checklist](qa/docs/manual-acceptance-checklist.md).
