# Stage 9 - bounded refactor, manual testing and portfolio

Base:8d6b8b0, separate branch qa/stage-9-portfolio. Main and approved PNGs unchanged.
This stage improves reviewability with protected extractions; it does not attempt
a large rewrite while lint/build gates remain red.

## Development work

- Address router/controller extracted from server/index.js. Global validation/DB
  guards remain before mounting; authentication preserved on each route. Mongoose
  operations are unchanged; another thin service layer would add no useful boundary.
  Source-only API exporter updated:73 live registrations plus3 retired paths.
- App fetchJson moved into utils with seven transport contract invocations, preserving
  same-origin/configured-origin fallback and final error behavior.
- Viewer CameraAnimator and EmptyAvatarModal extracted into real components. Camera
  frame-loop/damping handoff is unchanged, as are geometry disposal and static profile.
  No new hooks merely to move lines; remaining orchestration remains future work.
- Login form has explicit names/autocomplete, native keyboard registration switch,
  named reveal buttons and pressed state. This is a Development Fix, not QA-only work.

## QA work

- Six address characterization cases passed before extraction, then full134 backend
  tests passed. Frontend32 includes seven JSON transport invocations plus prior DOM
  boundaries. Real WebGL tests protect the extracted camera; jsdom does not claim3D.
- Compatibility: five scenarios on four profiles (desktop Chromium/Firefox, tablet768,
  mobile390).20 invocations, zero skips; same product/cart/checkout summary oracle.
  Default suite remains12; compatibility does not reuse visual baselines across engines.
- Initial named-password failure retained before fix. Desktop-only checkout locator
  and appended-project config were QA defects, corrected without hiding app failures.
- Tool-assisted exploratory screenshot review identified open mobile chat occlusion.
  Human screen reader/zoom/physical-device checks remain Not Run. See [manual log](manual-testing.md).
- [Bug Register](../bug-reports/bug-register.md), [RTM](rtm.md), [Feature Inventory](feature-inventory.md),
  [Test Summary](test-summary.md) and root README replace obsolete current-status claims.
  Historical reports remain unchanged and labeled historical.
- Full regression CI now includes the opt-in compatibility job using locked Firefox
  and Chromium. Existing five workflows stay; compatibility is not another duplicate suite.

## Review and remaining limits

See [curated evidence](../evidence/stage9-2026-11-17/README.md) for source manifest,
commands, timestamps and counts. Raw reports are ignored. Static gates still fail213
lint errors/14 warnings and109 TS diagnostics, unchanged from Phase8. They block
an all-green release claim; required gates have not been waived.

Portfolio is reviewable with known limitations, not complete accessibility/security
coverage or production readiness.150 cases is an expansion target; no fake tests,
blank framework directories or inflated cross-browser case counts are added.
Full scheduled/manual GitHub workflow execution still requires default-branch
availability; local results do not prove a scheduled workflow ran. Remote proof for
this branch belongs in its PR checks/body, with source SHA and actual checkout SHA.
