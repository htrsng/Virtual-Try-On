# Current traceability matrix

QA-derived requirements from observed behavior, not signed product specifications.
[Baseline RTM](requirements-traceability.md) is historical; [Test Summary](test-summary.md)
records execution status/source/environment.

| Requirement | Primary test source | Oracle | Finding |
| --- | --- | --- | --- |
| Valid/invalid session | Selenium SmokeTests/BusinessE2ETests, auth.test.js | UI session and real API identity | SEC-01/AUTH-01 |
| Current-role authorization | permissions.test.js, security.test.js, Selenium boundaries | 401/403 and UI guard | SEC-01, BUG-E2E-01 |
| Catalog and independent cart | Selenium catalog/cart, e2e-test-cases.csv | Fixture title/size/quantity and storage reload | - |
| Server-priced atomic order | checkout/order tests, E2E-ORD cases | Stored total/discount/stock and UI readback | DATA-01/02, BUG-E2E-02/03 |
| Address ownership/defaults | addresses.test.js: six cases | API response plus Mongo identities/default flags | Refactor characterization |
| Requested garment/size | tryon-3d.spec.ts L1/L2 | Mounted URL, geometry/bounds, WebGL state | BUG-3D-01 |
| Camera/animation response | tryon-3d.spec.ts camera/live cases | Actual camera and animation changes | Camera synchronization finding |
| Recovery/resource lifecycle | tryon-3d.spec.ts L4 | Error/recovery, warmed resource plateau | BUG-3D-02 |
| Wrong render detected | L3 visual plus separate diagnostic | Approved PNG and wrong-GLB diff/trace | Controlled diagnostic |
| JSON fallback/errors | fetchJson.test.ts: seven invocations | URL order, JSON, final503/HTML rejection | Refactor characterization |
| Keyboard login controls | compatibility.spec.ts login | Semantic names, Enter toggles, aria-pressed | BUG-A11Y-01 |
| Important browser/reflow paths | home/checkout/compatibility specs | Cart summary, viewport width, page errors | Stage 9 findings |
| Analyzable failures | policy.test.cjs and CI runner | Exit status, native XML, metadata/artifacts | CI-01 |

Cross-browser repeats do not add requirements. Smoke5 is a subset of Selenium22.
Two visual angles are one test; the intentional negative control is not a normal
passing business test. Initial12 designs and17 E2E rows are not an exhaustive count
of assertions; coverage percentages cannot be inferred from them.

## Quality completion coverage

- STATIC-LINT/BUILD: unchanged lint/strict compiler gates, source contracts and full bundle.
- BUG-UX-01: shared checkout journey rectangle/click oracle across four profiles.
- A11Y names/contrast/targets/scrollers: accessibility.spec.ts full-page audits on five routes/states.
- Keyboard/focus: Tab sequence, visible outline, support Escape/return and3D dialog containment.
- Build deployment boundary: production.spec.ts compiled assets/no dev client plus reused commerce smoke.
- AI refinement: AIOutfitGenerator.test.tsx pending/completion/error orchestration; external service mocked explicitly.
- Human acceptance: HAND-01..06 map to the manual designs; Not Run until results are supplied.

See automated-test-catalog.csv for enumerated instances, not an inflated business-case total.
