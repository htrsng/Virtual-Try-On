# Manual and exploratory testing - Stage 9

Current follow-up: [human acceptance checklist](manual-acceptance-checklist.md),
[quality-completion report](quality-completion.md). The user agreed to execute human
checks; results remain Not Run. BUG-UX-01 is now fixed and automated retest/evidence
are recorded separately; the sessions below retain the original observations.

Executed by the coding agent using local Playwright observations and explicit image
inspection on Windows,17 November2026. This is tool-assisted exploration/visual
review, not human tester or product-owner acceptance. Automated keyboard/navigation
results are in the compatibility report, not relabeled as manual passes.

## Executed sessions

| Session | Charter and evidence | Observations | Outcome |
| --- | --- | --- | --- |
| EXP-01 | Inspect login desktop1440x1000 screenshot plus real DOM/source; attempt named password input and keyboard registration | Password has placeholder only; registration was clickable span; reveal buttons emoji-only. Before regression times out on getByLabel. Added named controls/native button/autocomplete/aria-pressed; same semantic assertions retested across browsers | BUG-A11Y-01; automated retest tracked separately |
| EXP-02 | Inspect mobile390x844 cart screenshot, mobile full-page product, desktop login; compare layout to viewport measurements | Product title/price/size/actions remain readable; no horizontal document overflow in asserted home/product widths. Cart has real mobile checkout action, but floating chat partially overlaps its right side. Narrow automated paths can pass despite UX defects | BUG-UX-01 Open; sample committed below |

Evidence: [mobile cart sample](../evidence/stage9-2026-11-17/mobile-cart-overlap.png).
Raw before screenshot/trace and final browser screenshots remain ignored under
`.runtime/stage9/` and `.runtime/ci/playwright-compat/`. The mobile sample was
captured before correcting the desktop-only test locator; it demonstrates existing
app geometry, not a failed mobile checkout implementation. No real user data used.

## Reproducible charters and remaining manual work

1. **Keyboard auth**: fresh isolated fixtures, `/login`; Tab through form; use Enter
   on register and password reveal; verify visible focus, name/state announcement,
   no loss of entered data. Named controls/Enter/state are automated; full Tab order,
   focus visibility and screen-reader announcements remain Not Run manually.
2. **Responsive commerce**:390/768/1440 widths; inspect header, product, cart and
   checkout while scrolling/zooming. Verify chat does not cover payment action.
   Screenshots and width checks above executed;200% zoom, landscape, touch target
   measurement and all pages remain Not Run. Mobile chat overlap is Open.
3. **3D usability**: choose garment/size, rotate, zoom, reset and recover asset failure.
   Six real-render automation cases exist. Human fit realism, color judgment and
   assistive description of canvas remain Not Run; approved baselines are only the
   two previously reviewed PNGs, not general fit approval.
4. **Assistive technology**: NVDA/Firefox or equivalent, names/roles/errors/dialog
   focus, heading order, contrast and reduced motion across commerce/viewer.
   Not Run; no WCAG2.x AA certification or axe audit is claimed.
5. **Physical-device/cross-browser**: Safari/iOS and Android browser on real device,
   portrait/landscape, touch and WebGL recovery. Not Run; Chromium mobile is emulated.
6. **External services**: email/provider outage/privacy validation with approved
   sandbox credentials. Blocked without provider configuration; payment/social
   login/recovery success paths are Not Implemented, not test failures.

[Manual cases](manual-test-cases.csv) retain per-case execution status. A reviewed
screenshot cannot prove keyboard operability, contrast conformance, complete model
correctness or backend persistence. Known gaps are portfolio limitations, not hidden skips.
