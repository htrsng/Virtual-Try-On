# Selenium Java — VFitAI

Java 17, Maven 3.9+, Node 22, npm, Chrome or Edge installed. Exact test dependencies
are pinned in `pom.xml`. Selenium Manager resolves the matching driver on first run;
internet access is needed for Maven, driver and MongoDB downloads. No development
MongoDB, real account or application `.env` is needed.

From a clean clone, run from the repository root:

```sh
npm ci --prefix server
npm ci --prefix client
node scripts/qa-selenium.cjs -Dbrowser=chrome
```

Windows with Edge: `node scripts/qa-selenium.cjs` (default browser=edge).
For an interactive browser append `-Dheadless=false`. Set `SELENIUM_BROWSER_BINARY`
to an installed browser executable if it is outside the normal location. Selenium's
standard `webdriver.chrome.driver` / `webdriver.edge.driver` JVM properties can
provide a preinstalled driver in restricted environments.

The launcher starts the existing owned QA MongoDB replica set, API and Vite UI,
waits for readiness, runs Maven and stops services in `finally`, preserving Maven's
exit status. Run IDs are unique; ports default to API 3300 / UI 55173. Override
`QA_API_PORT` / `QA_UI_PORT` for simultaneous **separate suites**. Occupied ports
are refused. `MONGOMS_SYSTEM_BINARY` may point to a compatible local `mongod`;
set `MONGOMS_RUNTIME_DOWNLOAD=false` to disallow automatic MongoDB downloads.

Each invocation resets owned fixtures, creates a new WebDriver/profile, runs
independent assertions, captures failures, quits the browser and clears test data.
The generated account credentials stay in the ignored `.runtime/qa/<runId>/`
manifest and are scrubbed at shutdown. Never upload that manifest.
Tests are serial because reset/clear affects the suite database. Do not turn on
TestNG parallel methods or parallel DataProviders without per-test environments.

## Scope and commands

| Method | Assertions | Group |
| --- | --- | --- |
| customerCanLoginThroughUi | actual UI login redirects home and establishes session | auth |
| invalidLoginHasNoSession (2 data rows) | visible error, no session, stays at login | auth |
| catalogLinkOpensCorrectProduct | fixture catalog link, exact title and URL | catalog |
| selectedCartItemReachesCheckout | selection gates checkout, one correct shirt/size/quantity | checkout |

Five invocations, four scenarios. All belong to `smoke`; use
`node scripts/qa-selenium.cjs -Dgroups=auth` to select a group. No retries or
method dependencies. Login UI is exercised directly, not bypassed via API/token.
The checkout scenario stops at the summary: order submission/payment, RBAC,
WebGL rendering and visual regression are outside this smoke suite.

`node scripts/qa-selenium.cjs -Dgroups=diagnostics` deliberately fails one probe.
Expected: nonzero exit, PNG screenshot, failure report, stopped services and a
scrubbed manifest. It is excluded from default smoke and CI. This validates error
handling without registering a fake application bug.

## Reports and extension

Maven/TestNG XML, HTML, stack traces and Reporter logs:
`qa/selenium-java/target/surefire-reports/`. Failure screenshots:
`target/screenshots/`; local reset diagnostics: `target/qa-control.log`.
All generated output is ignored. Reports are overwritten by subsequent runs;
copy needed results to `.runtime/` before rerunning. CI uploads only reports and
screenshots for 14 days, never the credential-bearing environment directory.

`BaseTest` owns lifecycle only. `DriverFactory` configures browser/timeouts;
`QaEnvironment` calls the guarded local reset/clear CLI. Page Objects encapsulate
real pages and operations; tests own assertions. Locators use semantic input types,
product href and scoped application classes, with text only for size/summary.
Implicit wait is zero; explicit waits use DOM, navigation or cart state. No fixed
sleeps. Add a page/component only when an actual repeated UI interaction needs it.

The current configuration uses WebDriver only, not CDP. A warning about a browser
CDP version does not imply WebDriver failure; browser/network diagnostics remain
the Playwright workstream. See [execution evidence](../docs/stage-5-selenium.md)
for tested versions, results and limitations.
