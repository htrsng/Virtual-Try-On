# Test Summary -18 November2026

The original quality-completion run used base commit `b0fc753` plus local changes.
[Curated evidence](../evidence/quality-completion-2026-11-18/README.md) records exact
source hashes, commands, timestamps and environments. Clean CI source/checkout
SHAs are recorded in [PR5 checks](https://github.com/htrsng/vfitai-qa-automation/pull/5).

## Clean main verification

On November 18, 2026, the local rerun started from a clean checkout of [`284da4f`](https://github.com/htrsng/vfitai-qa-automation/commit/284da4f65b0bed6650a5e88c73795af6888cf592) on Windows with Node.js 22.15.0 and a temporary MongoDB replica set using the local 8.2.6 binary.

| Check | Local result |
| --- | --- |
| ESLint | Passed |
| Production build | Passed |
| Vitest | 38/38 passed |
| Jest/Supertest | 134/134 passed on an isolated rerun |
| Playwright default | 12/12 passed, including 6 WebGL cases |
| Selenium regression | 22/22 passed on an isolated rerun |

In the initial parallel run, Jest reported 133/134 with one 5-second timeout. Selenium reported 21/22: the cancellation case read stock 5 immediately after ordering, where it expected 4 before cancellation. Both suites passed when rerun separately on the same SHA. The cause of the initial failures was not established. Compatibility, accessibility, production-preview, and visual-baseline results below are from the original run.

GitHub Actions recorded two successful push workflows for this exact SHA. [Backend API Integration](https://github.com/htrsng/vfitai-qa-automation/actions/runs/44326117471) · [Code Quality](https://github.com/htrsng/vfitai-qa-automation/actions/runs/44326116957).

## Original quality-completion results

Windows, Node22.15.0, Java17.0.12, Maven3.9.10, MongoDB8.2.6 owned replica sets.
Playwright1.60.0: Chromium148.0.7778.96/revision1223, Firefox150.0.2/revision1522.
Axe Playwright4.14.0. No development database or live provider credentials.

| Suite | Result | Scope |
| --- | --- | --- |
| ESLint | Pass:0 errors,0 warnings | Existing configuration preserved |
| Production build | Pass:0 TS diagnostics, Vite bundle generated | Existing strict compiler preserved; no bypass |
| Frontend |38/38 Pass | DOM/transport, avatar identity, variant selection, refinement state, modal keyboard |
| Backend/API/integration |134/134 Pass |14 suites, owned temporary MongoDB |
| Selenium full regression |22/22 Pass | Includes smoke5, UI order and API/Mongo readback |
| Playwright default |12/12 Pass | Includes six real WebGL cases |
| Compatibility |20/20 Pass | Five scenarios x four profiles; chat/checkout overlap assertion |
| Accessibility |21/21 Pass | Seven scenarios x three profiles;15 full-page WCAG/contrast audits plus keyboard/CSS zoom |
| Production smoke |4/4 Pass | Compiled assets/no dev client plus catalog/checkout through Vite preview and owned API |
| Windows visual |1/1 Pass; detector verified | Two approved PNGs, wrong-GLB diff/trace; final capture-helper retest recorded in evidence |
| Typecheck/actionlint/report policy | Pass | No removed assertions or arbitrary skips |

## Counting

[Automated case catalog](automated-test-catalog.csv) enumerates executed instances
by source/layer. It counts parameterized data rows separately and de-duplicates
Playwright repeats by file/title across projects/suites. Smoke5 is included in
Selenium22. Compatibility20 and accessibility21 are repeated executions, not that
many new business designs. Production reuses three existing cases and adds one
compiled-bundle check. Candidate PNG export and intentional failure probes are
not passing visual-regression/business cases.

The original150 target describes source-confirmed business test design, not a
threshold reached by adding unit/API counts.8 manual designs and6 human acceptance
procedures are tracked separately, with no fabricated Pass or human sign-off.

## CI and historical results

Current branch PR checks provide SHA/environment and native JUnit/HTML/axe JSON,
screenshots/traces; artifacts retain14 days. Reports record actual checkout and
source-head SHA, not merely a branch name. Linux3D also exports candidate images
for independent review; export success does not approve a visual baseline.

Historical Stage9 sourceb0fc753: [quality44106899752](https://github.com/htrsng/vfitai-qa-automation/actions/runs/44106899752),
[backend44106900052](https://github.com/htrsng/vfitai-qa-automation/actions/runs/44106900052),
[smoke44106899894](https://github.com/htrsng/vfitai-qa-automation/actions/runs/44106899894),
[3D44106899733](https://github.com/htrsng/vfitai-qa-automation/actions/runs/44106899733).
Those passed backend134/frontend32/smoke5/3D6/visual1 but failed lint213+14/build109;
they are not current clean-gate evidence and remain preserved as before-fix history.

## Acceptance limits

The user agreed to execute the [human acceptance checklist](manual-acceptance-checklist.md).
NVDA/VoiceOver, native zoom200%, Safari/iOS and physical-device results remain Not Run.
CSS zoom and Chromium device emulation do not substitute for those checks. The old
mobile occlusion finding is fixed with a rectangle regression and screenshot evidence.

Online payment/social login/recovery remain unavailable or unimplemented. Live
Gemini/email are not verified. The large3D vendor chunk has an advisory size warning;
no device performance, full WCAG/security certification or production release
approval is implied. See [quality report](quality-completion.md) and [Bug Register](../bug-reports/bug-register.md).
