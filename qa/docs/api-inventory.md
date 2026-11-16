# API inventory — Stage 1

Generated from server/index.js and server/routes/ai.routes.js by
`node scripts/export-api-inventory.cjs`. 71 live route registrations + 3 retired paths.
The response descriptions are maintained explicitly in the exporter; review them with handler changes.

Admin includes inherited prefix guards for /api/admin, /api/users, /api/coupons.
Authenticated owner means DB identity from JWT, with resource filters described in
[permission matrix](permission-matrix.md). All live API routes require DB readiness (503).
Payment responses intentionally have no success path until a provider is connected.

| Method | Route | Access | Success / intentional disabled status | Response data |
|---|---|---|---|---|
| GET | `/api/user/addresses` | Authenticated owner | 200 | addresses[] (owner) |
| POST | `/api/user/addresses` | Authenticated owner | 200 | success, address (owner) |
| PUT | `/api/user/addresses/:addressId` | Authenticated owner | 200 | success, address (owner) |
| GET | `/api/products` | Public | 200 | normalized product[] |
| GET | `/api/products/next-id` | Admin (stored role) | 200 | nextId |
| GET | `/api/products/:id/stock` | Public | 200 | id, stock, totalStock, variants |
| PUT | `/api/products/:id` | Admin (stored role) | 200 | normalized or updated product |
| DELETE | `/api/products/:id` | Admin (stored role) | 200 | message |
| POST | `/api/admin/products/normalize-ids` | Admin (stored role) | 200 | status, normalization summary (explicit maintenance) |
| POST | `/api/admin/migrate-products` | Admin (stored role) | 200 | success, message, migrated count |
| POST | `/api/products` | Admin (stored role) | 201 | normalized or updated product |
| GET | `/api/products/:id` | Public | 200 | normalized or updated product |
| POST | `/api/auth/register` | Public | 201 | message, token, user (safe identity/profile) |
| POST | `/api/auth/login` | Public | 200 | message, token, user (identity/profile) |
| GET | `/api/auth/me` | Authenticated owner | 200 | safe user identity/profile, addresses, version |
| PUT | `/api/auth/profile` | Authenticated owner | 200 | message, safe user |
| GET | `/api/users` | Admin (stored role) | 200 | safe user(s), no passwords/login counters |
| DELETE | `/api/users/:id` | Admin (stored role) | 200 | message |
| PUT | `/api/users/:id` | Admin (stored role) | 200 | safe user(s), no passwords/login counters |
| GET | `/api/users/:id` | Admin (stored role) | 200 | safe user(s), no passwords/login counters |
| GET | `/api/users/:id/orders` | Admin (stored role) | 200 | user order[] (admin only) |
| GET | `/api/users/:id/used-coupons` | Admin (stored role) | 200 | user coupon usage[] |
| GET | `/api/users/:id/stats` | Admin (stored role) | 200 | totalOrders, totalSpent, usedCoupons |
| GET | `/api/used-coupons` | Authenticated owner | 200 | coupons: authenticated owner coupon code strings only |
| GET | `/api/coupons/:code/users` | Admin (stored role) | 200 | usage[] with user email/fullName/role (admin only) |
| POST | `/api/orders` | Authenticated owner | 201 | message, order (server-priced) |
| GET | `/api/orders/my-orders` | Authenticated owner | 200 | owner order[] (items, server totals, shipping, status) |
| GET | `/api/orders` | Admin (stored role) | 200 | order(s), item snapshots, totals, status; admin list may populate owner name/email |
| PUT | `/api/orders/:id` | Admin (stored role) | 200 | order(s), item snapshots, totals, status; admin list may populate owner name/email |
| DELETE | `/api/orders/:id` | Admin (stored role) | 405 | METHOD_NOT_ALLOWED (audit retained) |
| PUT | `/api/orders/:id/cancel` | Authenticated owner | 200 | message, owner order; stock restoration in transaction |
| GET | `/api/virtual-closet` | Authenticated owner | 200 | owner closet items, groupedByCategory, totalItems |
| GET | `/api/virtual-closet/category/:category` | Authenticated owner | 200 | owner items for category |
| POST | `/api/virtual-closet/wear/:itemId` | Authenticated owner | 200 | message, updated owner item |
| DELETE | `/api/virtual-closet/:itemId` | Authenticated owner | 200 | message (owner item removal) |
| GET | `/api/virtual-closet/stats/summary` | Authenticated owner | 200 | owner closet counts/category/wear statistics |
| POST | `/api/virtual-closet/add` | Authenticated owner | 200 | message, imported owner item (source=import) |
| POST | `/api/saved-outfits` | Authenticated owner | 201 | success, outfit |
| GET | `/api/saved-outfits` | Authenticated owner | 200 | success, owner outfits[] |
| DELETE | `/api/saved-outfits/:id` | Authenticated owner | 200 | success (owner scoped) |
| POST | `/api/tryon/session` | Public | 201 | success, session_id, session_url |
| GET | `/api/tryon/session/:id` | Public | 200 | success, session (product references/sizes; no PII) |
| GET | `/api/admin/ai-stats` | Admin (stored role) | 200 | AI request counts, missing rates, recent logs |
| GET | `/api/banner-contents` | Public | 200 | banner(s): bannerId/title/content/imageUrl/isActive |
| GET | `/api/banner-contents/:bannerId` | Public | 200 | banner(s): bannerId/title/content/imageUrl/isActive |
| POST | `/api/banner-contents` | Admin (stored role) | 200 | banner(s): bannerId/title/content/imageUrl/isActive |
| PUT | `/api/banner-contents/:bannerId` | Admin (stored role) | 200 | banner(s): bannerId/title/content/imageUrl/isActive |
| DELETE | `/api/banner-contents/:bannerId` | Admin (stored role) | 200 | message |
| GET | `/api/wishlist` | Authenticated owner | 200 | owner product snapshot[] |
| POST | `/api/wishlist/add` | Authenticated owner | 200 | message, owner products (non-authoritative snapshots) |
| POST | `/api/wishlist/remove` | Authenticated owner | 200 | message, owner products (non-authoritative snapshots) |
| POST | `/api/wishlist/sync` | Authenticated owner | 200 | message, owner products (non-authoritative snapshots) |
| GET | `/api/products/:productId/can-review` | Authenticated owner | 200 | canReview, hasPurchased, hasReviewed, message |
| GET | `/api/reviews/:productId` | Public | 200 | reviews (public fields), avgRating, totalReviews |
| POST | `/api/reviews` | Authenticated owner | 200 | message, review |
| POST | `/api/reviews/:id/like` | Public | 200 | _id, likes only (missing review=404) |
| POST | `/api/chat/send` | Public / optional verified user | 200 | userMessage, botReply; owner only from verified token |
| GET | `/api/chat/history` | Authenticated owner | 200 | owner chat message[] |
| GET | `/api/admin/chat/conversations` | Admin (stored role) | 200 | conversation[] (admin only) |
| GET | `/api/admin/chat/messages/:userId` | Admin (stored role) | 200 | user chat messages (admin only) |
| POST | `/api/admin/chat/reply` | Admin (stored role) | 200 | persisted admin chat reply |
| GET | `/api/notifications` | Authenticated owner | 200 | owner notifications, unreadCount |
| PUT | `/api/notifications/read` | Authenticated owner | 200 | message; updates owner notifications only |
| POST | `/api/view-history` | Authenticated owner | 200 | message; writes authenticated owner only |
| GET | `/api/recommendations` | Public / optional verified user | 200 | product[]; optional verified owner personalization, limit 1..50 |
| POST | `/api/payment/create` | Authenticated owner | 503 | PAYMENT_UNAVAILABLE; foreign/missing order=404, invalid id=400 |
| GET | `/api/payment/status/:paymentId` | Authenticated owner | 404 | PAYMENT_NOT_FOUND; never fabricated success |
| GET | `/api/admin/sync-status` | Admin (stored role) | 200 | status, data: totalOrders/totalUsers/totalProducts/lastChecked/isSynced |
| GET | `/api/admin/get-all-data` | Admin (stored role) | 200 | status, aggregate counts/product sales; no credential records |
| POST | `/api/admin/check-sync` | Admin (stored role) | 200 | status, isSynced, message, stats or diagnostic suggestion |
| POST | `/api/ai/outfit-suggest` | Authenticated owner | 200/503 | outfits/suggestions/meta; AI_NOT_INITIALIZED if no provider |

Retired paths (all methods, all environments, every role):

- `/api/auth/create-admin`: 404; no bootstrap/reset/clear handler remains.
- `/api/admin/reset-data`: 404; no bootstrap/reset/clear handler remains.
- `/api/admin/clear-all-data`: 404; no bootstrap/reset/clear handler remains.

Errors: 400 invalid input/JSON, 401 missing/invalid/expired/deleted identity, 403 non-admin,
404 missing/foreign resources, 409 conflict/state/version/duplicate coupon, 413 oversized JSON,
503 database/payment/AI unavailable. See [validation rules](validation-rules.md).
