# Quality completion -18 November2026

Scope: fix the measured quality failures, mobile checkout occlusion and observed
accessibility defects; verify existing business/3D behavior; make evidence and
remaining acceptance work traceable. Provider implementation and human/device
acceptance are explicitly separate from automation.

## Development changes

- Preserve the existing strict TypeScript and ESLint configurations. Replace
  implicit/explicit dynamic contracts with catalog, garment and AI response types;
  add narrow declarations for actual legacy-JS public interfaces. No `any` aliases,
  broad suppression, disabled checks or excluded failing modules.
- Remove unused declarations, the unreferenced AIOutfitRoom_new copy and malformed,
  unused update3D patch script. Separate body-shape/size engines from React views.
  Keep algorithm behavior and reviewed visual baseline hashes unchanged.
- Derive valid avatar identity and variant purchase defaults from current data;
  scope manual purchase overrides to their variant. Fix AI refinement's undefined
  loading setter, and use supported Three.js animation APIs instead of mutating
  hook-owned action properties. New DOM tests protect these fixes.
- Move support chat above the mobile cart bar, name controls, manage support focus
  and Escape, and trap/restore focus for the avatar dialog. Make the logo, action
  buttons, scrolling recommendations and item-selection controls accessible.
- Fix measured contrast on product/cart/checkout, small touch targets and auth/header
  reflow at CSS zoom200%. Preserve the checks that originally exposed each failure.
  Cart shows subtotal/shipping-to-be-calculated rather than implying free shipping.
- Disable unimplemented social-login buttons with an explanation; password recovery
  is explicitly unavailable. No fake payment/provider success is introduced.

## QA and CI changes

- Existing API134 and Selenium22 regression cover real persistence, role boundaries,
  stock and coupons. Frontend38 adds identity, variant-choice, refinement pending/error
  and dialog keyboard regressions; DOM mocks are not claimed as real rendering.
- Playwright default12 retains six real-render tests. Compatibility20 repeats five
  scenarios across four profiles and checks chat/checkout rectangles do not overlap.
- Accessibility21 runs seven scenarios across Chromium/Firefox/mobile emulation.
  It includes15 full-page axe audits (home/login/product/cart/checkout), keyboard
  Tab/focus, support Escape/return-focus and CSS zoom200%. No rule exclusions or
  WCAG-conformance certificate; incomplete/manual axe findings remain in raw JSON.
- Production smoke builds then starts Vite preview with the owned API/MongoDB,
  verifies four checks including compiled assets/no development client. It does
  not deploy or use a production database. Default development mode is preserved.
- Browser PR CI adds compatibility, accessibility and production smoke. Full
  regression includes them as isolated jobs. Artifacts retain SHA/environment,
  native XML/HTML, axe data and failure evidence; test under-collection is blocked.
- Linux functional CI also exports platform-specific front/left render candidates.
  Export success is not a visual-regression verdict or approval. Candidate reports
  are separate from the six functional results; Windows baselines are not copied.

## Acceptance and limits

Run counts/results are in [Test Summary](test-summary.md) and curated evidence.
Source hashes distinguish dirty local verification from later clean CI checkouts.
Historical Stage8/9 failures remain historical; they are not rewritten as passes.

The user agreed to perform human acceptance. [Checklist](manual-acceptance-checklist.md)
and an empty results template cover NVDA/VoiceOver, native-browser zoom200%, real
phones and gestures. These remain Not Run until actual evidence is supplied. Phone
checks need a reachable approved test URL; loopback is not a phone deployment.

Windows visual snapshots remain the approved profile; a new platform requires
review of its own candidate images and environment, repeat stability and a detector
check before enabling a visual gate. Live Gemini/email and online payment/social
login/recovery remain unverified or unimplemented as listed in the inventory.

The3D vendor chunk still exceeds Vite's500kB advisory; no FPS, device performance,
complete accessibility/security certification or150-business-case coverage is claimed.
