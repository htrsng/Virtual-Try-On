# Test strategy - current Stage 9

QA-derived expectations come from source and observed behavior. Feature presence,
designs, executed tests and signed product requirements are distinct. See
[Feature Inventory](feature-inventory.md), [RTM](rtm.md), [Test Summary](test-summary.md).

| Tool | Responsibility | Current implementation |
| --- | --- | --- |
| Selenium/Java/TestNG/Maven/POM | Functional UI and commerce E2E | Smoke5 subset of22 regression invocations; real UI login/order submission and API/Mongo readback |
| Playwright/TypeScript | WebGL/state/visual/network diagnostics | Six3D functional cases; reviewed Windows visual1 plus separate expected-failure detector |
| Playwright compatibility | Browser/reflow/keyboard checks | Five scenarios across four configurations;20 invocations, not20 independent designs |
| Jest/Supertest/Mongoose | API validation/RBAC/business integration |134 tests against owned temporary replica sets |
| Vitest/Testing Library | DOM boundaries and transport |38 tests; R3F mocked only for DOM composition, never claimed as WebGL evidence |
| Manual/exploratory | Usability, screenshot review, assistive technologies | Executed reviews and Not Run charters tracked separately; no fabricated human sign-off |
| Python API fuzzing | Separate coursework | Archived; excluded from VFitAI coverage |

P0: reproducible environment, authorization, server pricing/transactions and smoke.
P1: E2E persistence, negative cases, model loading/state/visual and reliable CI.
P2: bounded refactor, compatibility, accessibility/UX and reviewable portfolio.

## Design and isolation

Use equivalence classes, boundaries, role decision tables and state transitions
when supported by real contracts. Test methods assert behavior, Page Objects own
UI actions. Fresh browser/driver and reset/clear synthetic fixtures per test; no
shared mutable session or order dependency. Explicit waits follow observable state.
No fixed sleeps, retries or weaker assertions to make failures pass.

Only owned QA MongoDB is reset; application/development data and real accounts are
outside automated tests. Secrets and manifests are excluded from artifacts. Provider
payment is unavailable by design and live Gemini/email are not verified by mocks.

## Results and gates

Passed requires executed assertions. Failed is a verified assertion/static-check
failure; InfrastructureFailure means provisioning/runner could not execute; Blocked
means prerequisites missing; Skipped is explicitly visible and cannot turn an empty
or partly skipped required suite green. Manual Not Run never becomes Pass by design.

Reports record source SHA/dirty state or source manifest, command, timestamps, actual
environment and counts. CI retains native JUnit/HTML/logs/screenshots/traces14 days.
The Stage8 policy protects empty, missing and under-collected reports. PR/full regression
add Firefox/Chromium compatibility, automated accessibility and production-bundle smoke;3D visual stays on its reviewed Windows profile.

Refactor: characterize first, extract one responsibility, rerun unit/API and complete
browser regression, review source diff. Do not replace a baseline or count history as
a new run. Lint/build failures remain blocking when present; the quality-completion branch fixes the measured baseline without waivers.
Manual assistive technology checks and real devices need separate execution; these
checks do not certify WCAG compliance or complete accessibility/security coverage.
