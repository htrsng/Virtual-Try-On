# Stage 9 findings and retest

Source base8d6b8b0, local dirty worktree on17 November2026. Raw reports are ignored;
curated execution summary records the source manifest. No production data used.

## BUG-A11Y-01 - Login controls lack explicit names/keyboard semantics

P1 Application Defect. `/login`: password fields lack associated label/aria-label;
password reveal is emoji-only and registration mode is a clickable span without
keyboard interaction. Expected: discoverable named inputs and native button behavior.
Before: `getByLabel('Mat khau')` (Vietnamese accented string in actual spec) times
out; source also confirms the span and emoji-only controls. Before screenshot/trace
retained in `.runtime/stage9/compat-before/`; not a claim of a screen-reader run.

Development Fix: explicit aria-label/autocomplete, native mode-switch button,
password-toggle names and aria-pressed. QA: real keyboard Enter toggles, named
registration fields, password input type and pressed state. Retest per final
compatibility summary, without bypassing accessibility locators. This fixes a
specific defect, not complete WCAG conformance.

## BUG-UX-01 - Floating chat partially overlaps mobile checkout

P2 Application Defect, Open. Synthetic customer/cart at390x844, one selected shirt.
The60px chat button at bottom20/right20 overlaps the right side of the fixed cart
checkout area. Expected: primary checkout fully unobscured. Actual: screenshot
shows chat over checkout text/action region. Source ChatWidget inline fixed position
and CartPage bottom bar support the observation. This is partial occlusion; do not
claim checkout is entirely impossible. Center-click regression can still pass.

[Sample](../evidence/stage9-2026-11-17/mobile-cart-overlap.png). Follow-up: coordinate
floating widget and page action bars, then assert no bounding-box intersection and
verify touch/keyboard behavior across narrow widths. No speculative UI fix included.

## QA defects resolved

TD-09-01: inherited Playwright defineConfig merge appended base projects, collecting31
instead of20 intended compatibility invocations. Switched to explicit spread/replace;
`--list` verifies20 compatibility and12 default cases. First run preserved separately;
not counted as final clean matrix evidence.

TD-09-02: existing checkout test selected hidden desktop `.cp-checkout-btn` on mobile.
Cart already has a real mobile action. Use accessible role/name locator, require
exactly one visible enabled checkout action, then preserve URL/product/size/quantity
assertions. No force clicks, skips or changed business oracle.

## Refactor review

Address handlers moved byte-for-byte in behavior to controller plus router. Global
validation/DB middleware remains before the router; per-route authentication stays.
Six characterization tests passed before extraction and join complete API regression.
No extra service layer added merely to rename Mongoose calls. App transport moved to
fetchJson.ts; seven contract invocations cover same-origin/fallback/errors. Viewer
camera and avatar modal extracted with existing DOM and real WebGL tests protecting
behavior. No approved baseline changes.
