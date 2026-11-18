# Consolidated bug register

Current status follows the18 November quality-completion branch; historical reports retain their original before states. Status is scoped to recorded tests, source and environment, not certification.
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
| BUG-UX-01 P1 | Application: mobile chat overlaps checkout | Fixed, regression verified | [Quality completion](quality-completion.md), zero rectangle intersection and synthetic after screenshot |
| STATIC-LINT P0 | Code quality: baseline213 errors/14 warnings | Fixed locally:0/0 | [Quality completion](quality-completion.md), unchanged ESLint config; clean CI proof in current PR |
| STATIC-BUILD P0 | Code quality: baseline109 TS diagnostics | Fixed locally: full build Pass | Quality completion, same strict compiler and real production smoke |
| BUG-A11Y-02..05 P1 | Names/targets/contrast/scroll/focus/dialog behavior | Fixed in measured scope | [Before/fix/retest](quality-completion.md), axe plus native keyboard; human acceptance pending |
| BUG-AI-01 P1 | Refinement undefined loading setter | Fixed, unit regression verified | Pending/completion/error tests; no live-provider claim |
| TD-09-01/02 P2 | Test defects: appended compatibility projects / desktop-only cart selector | Corrected and retested | Stage9; final20 compatibility/default12 collection; no false application bug |
| CI-WIN-NET P2 | Infrastructure: npm ECONNRESET before visual execution | Recovered on one rerun | [Run44097933562](https://github.com/htrsng/Virtual-Try-On/actions/runs/44097933562), separate attempt artifacts retained |

Historical baseline findings and old failures remain in their original reports.
Wrong-GLB injection is a deliberate diagnostic, not an open production bug. Manual
Not Run and incomplete provider features are coverage/product gaps, not invented
failed executions. No secrets or sensitive production data appear in samples.
