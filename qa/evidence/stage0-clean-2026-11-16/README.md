# Stage 0 — clean local clone evidence

Source: `3d6109745e1ec6a3035f7af25ea586357784fa1a`. Windows 11, November 16, 2026, Asia/Saigon. [Baseline report](../../docs/baseline-report.md).

- `check-summary.json` records exit codes after installation. The root path identifies the local clone. `browser-inventory` records test discovery only.
- `startup-summary.json` records HTTP 200 for the API, UI, and proxy, plus browser exit 0 after Chromium installation.
- `source-sha256.json` fingerprints source, configuration, and lockfiles from the clean clone.
- `log-sha256.json` and `startup-log-sha256.json` fingerprint the raw logs under local `.runtime/stage0-clean/.runtime/`.

Retained runs: `baseline-1794841660830`, `startup-1794841911272`, and `backend-portable-glob-local.log` for the relative-glob diagnostic. Build, lint, unit, and backend checks were below passing status. Three browser cases passed with conditional assertions, so checkout evidence is tracked separately. Keep secrets, databases, generated reports, and full screenshot collections outside Git.
