# Consolidated bug register

Status is scoped to recorded tests, source and environment, not certification.
See [Test Summary](../docs/test-summary.md) for current executions and CI links.

| ID / priority | Type and finding | State | Fix / retest evidence |
| --- | --- | --- | --- |
| SEC-01 P0 | Application: missing sensitive-route role checks | Fixed, regression verified | [Stage1](STAGE1-P0.md), current backend permission matrix |
| SEC-02 P0 | Application: unsafe bootstrap/reset handlers | Retired, regression verified | Stage1:404 even for admin, non-destructive regression |
| DATA-01 P0 | Application: client-authoritative order totals | Fixed, regression verified | Stage1, server catalog pricing and persisted E2E totals |
| DATA-02 P0 | Application: non-atomic stock/coupon changes | Fixed within tested contract | Stage1 checkout concurrency/rollback tests |
| AUTH-01 P0 | Application: client-supplied identity | Fixed, regression verified | Stage1 owner scopes and invalid/revoked identities |
| PAY-01 P0 | Application: fabricated payment success | Unsafe flow removed | Stage1, provider unavailable503 and UI safety; real provider remains Not Implemented |
| VAL-01 / STATE-01 P0 | Application: unsafe input/status transitions | Fixed within tested contracts | Stage1 validation/state/concurrency, persisted E2E cancellation |
| BUG-E2E-01 P1 | Application: customer mounts admin tree | Fixed, regression verified | [Stage6](stage6-business-e2e.md), RequireAdmin plus Selenium role boundaries |
| BUG-E2E-02 P1 | Application: checkout calls missing coupon API | Fixed, regression verified | Stage6 coupon persisted usage/discount/total210000 |
| BUG-E2E-03 P1 | Application: toast remount resets checkout | Fixed, regression verified | Stage6 stable RouteShell and complete coupon E2E |
| BUG-3D-01 P1 | Application: requestedM rendersS | Fixed, regression verified | [Stage7](stage7-3d.md), actual mounted size/geometry |
| BUG-3D-02 P1 | Application: warmed geometry resources grow | Fixed within tested transition workload | Stage7 resource plateau, not every device/long-run leak claim |
| BUG-A11Y-01 P1 | Application: missing named password/keyboard mode controls | Fixed,20-matrix retest Pass | [Stage9](stage9-portfolio.md), before named-input failure and after semantic checks |
| BUG-UX-01 P2 | Application: mobile chat overlaps checkout | Open | [Stage9 sample/repro](stage9-portfolio.md); partial occlusion, not total checkout failure |
| STATIC-LINT P1 | Application/code quality:213 errors,14 warnings | Open, required gate Failed | [Stage8](stage8-ci.md), Stage9 rerun unchanged counts |
| STATIC-BUILD P1 | Application/code quality:109 TS diagnostics | Open, required gate Failed | Stage8/9 full tsc+Vite command; no bypass |
| TD-09-01/02 P2 | Test defects: appended compatibility projects / desktop-only cart selector | Corrected and retested | Stage9; final20 compatibility/default12 collection; no false application bug |
| CI-WIN-NET P2 | Infrastructure: npm ECONNRESET before visual execution | Recovered on one rerun | [Run44097933562](https://github.com/htrsng/Virtual-Try-On/actions/runs/44097933562), separate attempt artifacts retained |

Historical baseline findings and old failures remain in their original reports.
Wrong-GLB injection is a deliberate diagnostic, not an open production bug. Manual
Not Run and incomplete provider features are coverage/product gaps, not invented
failed executions. No secrets or sensitive production data appear in samples.
