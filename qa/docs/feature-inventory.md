# Feature inventory - Stage 9

Source presence is separate from verified coverage. Details: [API inventory](api-inventory.md),
[permissions](permission-matrix.md), [validation](validation-rules.md).

| Feature | Implementation | Verification / boundary |
| --- | --- | --- |
| Auth/profile | AuthContext, LoginPage, auth routes | API auth and Selenium UI valid/invalid/session tests; registration not fully UI-E2E covered |
| Admin/RBAC | RequireAdmin and stored-role server guards | Guest/customer/admin matrix, revoked/demoted identities; API assertions |
| Catalog/cart | Product routes, App, ProductDetailPage, CartPage | Seeded catalog/detail/search/category, cart quantity/remove/reload; not every filter combination |
| COD/orders | CheckoutPage, checkout.js, Mongo transactions | UI submit, persisted totals/coupon/stock, owner cancel/admin status |
| Saved addresses | Address router/controller | Six API characterization tests: auth, owner isolation, persistence, default changes, validation |
| 3D viewer | VirtualTryOn, Avatar, GarmentModel, camera components | Six WebGL tests, one approved visual case/two PNGs, wrong-GLB detector |
| Closet/outfits/wishlist/history | Owner-scoped routes and UI | API ownership and delivered-order closet sync; not every UI path |
| Chat/reviews/notifications/banners | Application routes/components | Existing API assertions only; complete UX coverage not claimed |
| AI styling | AI routes, optional Gemini client | Input/fallback tests; live provider quality/availability not verified |
| Online payment | Explicit unavailable contract | Not Implemented as processing; owner503/foreign404 and no fake success |
| Social login/recovery | UI affordances only | Not Implemented as complete provider/recovery flows |
| Compatibility/accessibility | Opt-in Playwright matrix, login controls | Chromium/Firefox important paths, three Chromium widths, keyboard checks; not WCAG certification |

[System inventory](system-inventory.md) preserves broader source discovery.
A visible button alone is not a verified service; no150-case coverage claim.
