# Test Summary -17 November2026

## Current local Stage 9 verification

Base/source HEAD8d6b8b0 with **dirty Stage9 worktree**. Source file hashes and exact
commands/timestamps are retained in [curated evidence](../evidence/stage9-2026-11-17/README.md).
Windows, Node22.15.0, MongoDB8.2.6 owned ephemeral replica sets. Java17/Maven3.9,
Chromium148.0.7778.96 (revision1223), Firefox150.0.2 (revision1522). No development DB.

| Suite | Result | Scope |
| --- | --- | --- |
| Address pre-refactor characterization |6/6 Pass | Same contracts before extraction |
| Backend/API/integration |134/134 Pass |14 suites, includes six address contracts |
| Frontend |32/32 Pass | DOM/transport, no WebGL claim |
| Compatibility |20/20 Pass | Five scenarios x four profiles, zero skips |
| Selenium complete regression |22/22 Pass |22 invocations including smoke5; UI order plus API/Mongo readback |
| Playwright default |12/12 Pass |12, including six real WebGL cases |
| Approved Windows visual/detector |1/1 Pass + detector verified | One visual test/two PNGs; separate expected-failure detector |
| Playwright TypeScript / workflow actionlint | Pass | Config/fixtures and YAML validation |
| Lint | Failed:213 errors,14 warnings | Unchanged required failure |
| Full build | Failed:109 TS diagnostics | No bypass or excluded files |

Compatibility includes three existing browser scenarios plus two new keyboard/reflow
scenarios. It reuses cases across engines; do not sum it as20 new business cases.
Selenium smoke5 is included in regression22. The intentional wrong-model failure
verifies a detector separately, never counted as a normal passing product test.

## Verified remote CI before Stage 9

Source8d6b8b0, PR checkout merge b08fcc8, Node22.23.4, clean runners.
These runs precede the Stage9 refactor, and are not claimed as its CI verification.

| Run | Result |
| --- | --- |
| [Code Quality44097932842](https://github.com/htrsng/Virtual-Try-On/actions/runs/44097932842) | Frontend25, helpers14, policy12, typecheck Pass; lint/build Fail |
| [Backend44097932738](https://github.com/htrsng/Virtual-Try-On/actions/runs/44097932738) |128 Pass |
| [Selenium44097933463](https://github.com/htrsng/Virtual-Try-On/actions/runs/44097933463) | Smoke5 Pass |
| [3D44097933562](https://github.com/htrsng/Virtual-Try-On/actions/runs/44097933562) | Functional6 and Windows visual1/detector Pass; Windows npm ECONNRESET on first attempt classified InfrastructureFailure, rerun passed |

Reports attach actual source head and checkout SHA plus native JUnit/HTML, images
and traces. Download from each run's Artifacts (14-day retention; sign in as needed).
If expired, reproduce with the documented commands; no permanent artifact promise.
New Stage9 remote results are recorded in the branch PR, not inferred from old runs.

## Manual, bugs and release assessment

Two tool-assisted exploratory/visual review sessions documented in [manual log](manual-testing.md).
BUG-A11Y-01 fixed and automated retest Pass. BUG-UX-01 partial mobile chat/checkout
overlap stays Open with sample PNG. Screen-reader/contrast/200percent zoom/physical
devices remain Not Run. Mobile Chromium emulation is not Safari or real-device proof.

[Bug Register](../bug-reports/bug-register.md) separates app/test/environment issues.
Online payment/social login/recovery are incomplete; live Gemini/email not verified.
Static gates remain red. **Not approved for release; no claim of full coverage or
150 implemented cases.** Development refactor/fixes and QA work are distinguished
in [Stage9 report](stage-9-portfolio.md).
