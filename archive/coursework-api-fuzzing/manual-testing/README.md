# Manual testing

The [12 functional cases](test-cases.md) cover the original VFitAI UI: login, cart, checkout, orders, users, products, and size recommendations.

All cases are **NOT_RUN**. Running them requires the VFitAI frontend and a backend or mock API with a documented contract. The simulated API harness and archived Playwright work provide no UI E2E result for these cases.

For each run, record the date, build or commit, environment, actual result, PASS/FAIL/BLOCKED status, and a screenshot or trace. Keep the expected result tied to the requirement. Use NOT_RUN before execution and BLOCKED when an attempted case cannot proceed.
