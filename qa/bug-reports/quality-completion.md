# Quality completion findings -18 November2026

Before sourceb0fc753; fixes on improve/quality-completion. Local evidence uses
source hashes/dirty state; remote CI references the actual tested head. No live
customer account or production database used.

| ID | Before / expected | Development fix | QA retest |
| --- | --- | --- | --- |
| STATIC-LINT |213 errors/14 warnings; expected required lint to succeed | Remove dead declarations, precise types, fix refs/effects, split pure exports, remove obsolete malformed patch script |0 errors/0 warnings, same ESLint config |
| STATIC-BUILD |109 TS diagnostics; full build blocked | Correct actual contracts/nullability/type-only imports, UI loading setter, typed legacy public boundaries | Full tsc-b plus Vite Pass, strict config unchanged |
| BUG-UX-01 | Chat partially covers390x844 cart checkout | Cart-route launcher clearance respecting safe-area inset | Compatibility rectangle intersection0; screenshots and real click/navigation assertions |
| BUG-A11Y-02 | Logo/controls unnamed, small targets, nested hero controls, unfocusable mobile scroller | Accessible names/native link, larger targets, focusable named region | Full-page axe and keyboard across Chromium/Firefox/mobile |
| BUG-A11Y-03 | Low product/cart/checkout contrast and missing cart-item label | Darker scoped gold/muted/success palettes, named item checkbox; preserve visual theme | Original failing contrast/label rules retested, no excludes |
| BUG-A11Y-04 | Native Tab reaches input but CSS removes visible outline; CSS zoom overflows header | Specific focus-visible rule, flexible header/auth layout | Real Tab sequence/focus style and CSS zoom200 across profiles; native zoom remains human acceptance |
| BUG-A11Y-05 | Avatar modal has no keyboard focus containment/return behavior | Small focus lifecycle hook, Escape dismiss | DOM unit plus real3D fixture Shift+Tab/Tab assertions |
| BUG-AI-01 | Refinement calls undefined setIsGenerating | Separate refinement pending state merged with base loading | Pending/completion/error orchestration tests, no claim of live Gemini verification |
| UX-SHIPPING | Cart advertises free shipping and a final total before shipping selection | Show subtotal and shipping calculated at checkout | Existing server-total/COD/stock regressions retained |

Cases originally failing on only one profile remain regression checks, not skipped
exceptions: Firefox small targets, mobile scroll focus, all-profile cart labels,
contrast and input focus. Initial reports remain in ignored .runtime/improvement/.
No snapshot replacement, forced click, retry or raised visual tolerance was used.

Fixes are scoped to measured behavior, not exhaustive accessibility/security
certification. Manual device/screen-reader/native-zoom acceptance awaits the user.
Unimplemented external-provider features are product scope gaps, not fake passed tests.
