# VFitAI QA documentation

Use this guide to find tests by feature, review run evidence, or pick a test layer for a new regression case.

| Task | Start here |
| --- | --- |
| Check permissions, pricing, coupons, or stock | [Jest/Supertest](../server/tests/README.md) |
| Check COD checkout and order management through the UI | [Selenium/TestNG](selenium-java/README.md) |
| Check 3D models, browser compatibility, or accessibility | [Playwright](../tests/README.md) |
| Look up requirements, cases, and results | [Feature inventory](docs/feature-inventory.md) · [Traceability Matrix](docs/rtm.md) · [Test Summary](docs/test-summary.md) |
| Review confirmed defects and retests | [Bug Register](bug-reports/bug-register.md) |

## Run or extend the tests

- Set up an isolated run with the [QA environment guide](docs/environment-setup.md) and [test fixtures](test-data/README.md).
- For a new API test, check the [endpoint inventory](docs/api-inventory.md), [permissions matrix](docs/permission-matrix.md), and [validation rules](docs/validation-rules.md).
- Find existing coverage in the [test cases](docs/test-cases.csv), [business E2E cases](docs/e2e-test-cases.csv), [automated test catalog](docs/automated-test-catalog.csv), and [traceability matrix](docs/rtm.md).

## Read the reports

- Find logs, screenshots, traces, and job results in the [CI guide](docs/stage-8-ci-quality-gates.md).
- See the [quality review](docs/quality-completion.md) for completed checks and the [acceptance checklist](docs/manual-acceptance-checklist.md) for physical devices and assistive technology.
- Use the [test strategy](docs/test-strategy.md), [manual testing notes](docs/manual-testing.md), and [roadmap](docs/implementation-roadmap.md) to plan new coverage.

Use the catalog for case counts and the corresponding run report for execution results. The acceptance checklist tracks work that requires a person to carry out.
