# Frontend verification

ProductList/Toast in jsdom; context hooks and preview boundary mocked. No backend, WebGL or browser E2E.

| Check | Status | Exit | Log |
|---|---|---|---|
| components | PASS | 0 | components.txt |
| typecheck | FAIL | 2 | typecheck.txt |
| bundle | NOT_RUN | — | Typecheck failed; build script stops here. |
| lint | FAIL | 1 | lint.txt |

NOT_RUN is not PASS. Legacy typecheck/lint defects are preserved, not suppressed.
This scoped suite does not execute the legacy VirtualTryOn integration test.
