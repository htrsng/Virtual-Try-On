# Business flow testing with Selenium

A representative case signs in, selects a shirt, and places a cash-on-delivery (COD) order through the UI. It then reads the order back through the API to check the total, shipping fee, discount, and remaining stock. Other cases cover cancellations, order status changes, and access control. [Business tests](src/test/java/com/vfitai/qa/tests/BusinessE2ETests.java#L47) · [E2E evidence](../docs/stage-6-business-e2e.md).

## Run the tests

The suite uses Selenium 4.38.0, TestNG 7.11.0, Java 17, Maven 3.9+, Node.js 22, and Chrome or Edge. Selenium Manager resolves the matching driver. The first run may need network access to download the driver, Maven dependencies, or MongoDB.

Run from the repository root.

```sh
npm ci --prefix server
npm ci --prefix client
node scripts/qa-selenium.cjs -Dbrowser=chrome -Dgroups=smoke
```

Use `-Dbrowser=edge` to run Edge or add `-Dheadless=false` to watch the browser. If the browser is installed in a custom location, set `SELENIUM_BROWSER_BINARY` to its executable path.

## Choose a test group

| Group | Coverage |
| --- | --- |
| `smoke` | 5 executions covering valid and invalid login, opening a product, and taking a selected item to checkout. |
| `e2e` | COD orders, totals, stock, coupons, order status, access control, and cart operations. |
| `regression` | 22 executions across smoke and business cases. |

Run the full suite with `node scripts/qa-selenium.cjs -Dbrowser=chrome -Dgroups=regression`. CI runs smoke on pull requests. The full regression workflow runs on a schedule or by manual dispatch. [Business case list](../docs/e2e-test-cases.csv).

## Environment and reports

The launcher starts a MongoDB replica set, the API, and the UI. It waits for readiness, starts TestNG, and stops the services after Maven exits. Each case gets a fresh WebDriver and reset fixtures. To run alongside Playwright, assign `QA_API_PORT` and `QA_UI_PORT` to free ports other than the defaults (`3300` and `55173`). Set `MONGOMS_SYSTEM_BINARY` to use an installed compatible `mongod`. [Environment guide](../docs/environment-setup.md).

Find Maven/TestNG reports in `qa/selenium-java/target/surefire-reports/`, failure screenshots in `qa/selenium-java/target/screenshots/`, and reset logs in `qa/selenium-java/target/qa-control.log`. Copy any evidence you need before the next run. Keep the manifest with test account credentials local under `.runtime/qa/`.

The `diagnostics` group deliberately fails one case to verify screenshot capture and cleanup. Expect a nonzero exit code and a failure screenshot.

## Add a case

Place reusable UI actions in Page Objects and keep business assertions in the test. Wait for observable conditions such as an enabled button, visible content, or navigation. Keep TestNG methods and DataProviders serial while they share database resets.

## Find tests, results, and limits

Under `src/test/java/com/vfitai/qa/`, `tests/` contains scenarios, `pages/` contains Page Objects, and `base/` and `utils/` manage the browser and environment. On November 18, 2026, all 22 local regression executions passed. [QA report](../docs/test-summary.md).

Smoke ends at checkout summary. Choose `e2e` or `regression` to exercise COD submission and inspect the saved order. [Playwright](../../tests/README.md) covers WebGL rendering and image comparison.
