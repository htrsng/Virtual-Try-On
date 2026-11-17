// Read source only: no application import, database, secrets, or external services.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'server/index.js'), 'utf8');
const ai = fs.readFileSync(path.join(root, 'server/routes/ai.routes.js'), 'utf8');
function extract(source, object, prefix = '') {
  const pattern = new RegExp(`${object}\\.(get|post|put|patch|delete)\\(\\s*(['"])([^'"]+)\\2\\s*,([^\\n]+)`, 'g');
  return [...source.matchAll(pattern)].map(match => ({ method: match[1].toUpperCase(), route: prefix + match[3], handlers: match[4] }));
}
const descriptions = {
  '/api/health/live': ['200', 'status=alive, service; independent of database'],
  '/api/health/ready': ['200/503', 'status, service, database readiness; test runId when managed'],
  '/api/auth/register': ['201', 'message, token, user (safe identity/profile)'],
  '/api/auth/login': ['200', 'message, token, user (identity/profile)'],
  '/api/auth/me': ['200', 'safe user identity/profile, addresses, version'],
  '/api/auth/profile': ['200', 'message, safe user'],
  '/api/products/next-id': ['200', 'nextId'],
  '/api/products/:id/stock': ['200', 'id, stock, totalStock, variants'],
  '/api/products/:productId/can-review': ['200', 'canReview, hasPurchased, hasReviewed, message'],
  '/api/orders/my-orders': ['200', 'owner order[] (items, server totals, shipping, status)'],
  '/api/orders/:id/cancel': ['200', 'message, owner order; stock restoration in transaction'],
  '/api/coupons/:code/users': ['200', 'usage[] with user email/fullName/role (admin only)'],
  '/api/used-coupons': ['200', 'coupons: authenticated owner coupon code strings only'],
  '/api/virtual-closet': ['200', 'owner closet items, groupedByCategory, totalItems'],
  '/api/virtual-closet/category/:category': ['200', 'owner items for category'],
  '/api/virtual-closet/wear/:itemId': ['200', 'message, updated owner item'],
  '/api/virtual-closet/:itemId': ['200', 'message (owner item removal)'],
  '/api/virtual-closet/stats/summary': ['200', 'owner closet counts/category/wear statistics'],
  '/api/virtual-closet/add': ['200', 'message, imported owner item (source=import)'],
  '/api/tryon/session': ['201', 'success, session_id, session_url'],
  '/api/tryon/session/:id': ['200', 'success, session (product references/sizes; no PII)'],
  '/api/reviews/:productId': ['200', 'reviews (public fields), avgRating, totalReviews'],
  '/api/reviews': ['200', 'message, review'],
  '/api/reviews/:id/like': ['200', '_id, likes only (missing review=404)'],
  '/api/chat/send': ['200', 'userMessage, botReply; owner only from verified token'],
  '/api/chat/history': ['200', 'owner chat message[]'],
  '/api/notifications': ['200', 'owner notifications, unreadCount'],
  '/api/notifications/read': ['200', 'message; updates owner notifications only'],
  '/api/view-history': ['200', 'message; writes authenticated owner only'],
  '/api/recommendations': ['200', 'product[]; optional verified owner personalization, limit 1..50'],
  '/api/payment/create': ['503', 'PAYMENT_UNAVAILABLE; foreign/missing order=404, invalid id=400'],
  '/api/payment/status/:paymentId': ['404', 'PAYMENT_NOT_FOUND; never fabricated success'],
  '/api/admin/ai-stats': ['200', 'AI request counts, missing rates, recent logs'],
  '/api/admin/chat/conversations': ['200', 'conversation[] (admin only)'],
  '/api/admin/chat/messages/:userId': ['200', 'user chat messages (admin only)'],
  '/api/admin/chat/reply': ['200', 'persisted admin chat reply'],
  '/api/admin/sync-status': ['200', 'status, data: totalOrders/totalUsers/totalProducts/lastChecked/isSynced'],
  '/api/admin/get-all-data': ['200', 'status, aggregate counts/product sales; no credential records'],
  '/api/admin/check-sync': ['200', 'status, isSynced, message, stats or diagnostic suggestion'],
  '/api/admin/products/normalize-ids': ['200', 'status, normalization summary (explicit maintenance)'],
  '/api/admin/migrate-products': ['200', 'success, message, migrated count'],
  '/api/ai/outfit-suggest': ['200/503', 'outfits/suggestions/meta; AI_NOT_INITIALIZED if no provider'],
};
function describe(row) {
  if (descriptions[row.route]) return descriptions[row.route];
  const read = row.method === 'GET';
  if (row.route.startsWith('/api/users')) return ['200', row.route.endsWith('/stats') ? 'totalOrders, totalSpent, usedCoupons' : row.route.endsWith('/used-coupons') ? 'user coupon usage[]' : row.route.endsWith('/orders') ? 'user order[] (admin only)' : row.method === 'DELETE' ? 'message' : 'safe user(s), no passwords/login counters'];
  if (row.route.startsWith('/api/user/addresses')) return ['200', read ? 'addresses[] (owner)' : 'success, address (owner)'];
  if (row.route.startsWith('/api/products')) return [row.method === 'POST' ? '201' : '200', row.method === 'DELETE' ? 'message' : row.route === '/api/products' && read ? 'normalized product[]' : 'normalized or updated product'];
  if (row.route.startsWith('/api/orders')) return [row.method === 'POST' ? '201' : row.method === 'DELETE' ? '405' : '200', row.method === 'POST' ? 'message, order (server-priced)' : row.method === 'DELETE' ? 'METHOD_NOT_ALLOWED (audit retained)' : 'order(s), item snapshots, totals, status; admin list may populate owner name/email'];
  if (row.route.startsWith('/api/banner-contents')) return ['200', row.method === 'DELETE' ? 'message' : 'banner(s): bannerId/title/content/imageUrl/isActive'];
  if (row.route.startsWith('/api/wishlist')) return ['200', read ? 'owner product snapshot[]' : 'message, owner products (non-authoritative snapshots)'];
  if (row.route.startsWith('/api/saved-outfits')) return [row.method === 'POST' ? '201' : '200', read ? 'success, owner outfits[]' : row.method === 'DELETE' ? 'success (owner scoped)' : 'success, outfit'];
  throw new Error(`Missing response description: ${row.method} ${row.route}`);
}
const rows = [...extract(index, 'app'), ...extract(ai, 'router', '/api/ai')].map(row => {
  const inheritedAdmin = /^\/api\/(admin|users|coupons)(\/|$)/.test(row.route);
  const access = inheritedAdmin || row.handlers.includes('requireAdmin') ? 'Admin (stored role)' : row.handlers.includes('optionalAuthenticate') ? 'Public / optional verified user' : row.handlers.includes('authenticateToken') ? 'Authenticated owner' : 'Public';
  const [success, response] = describe(row);
  return { method: row.method, route: row.route, access, success, response };
});
const retired = ['/api/auth/create-admin', '/api/admin/reset-data', '/api/admin/clear-all-data'];
const header = `# API inventory — Stage 2\n\nGenerated from server/index.js and server/routes/ai.routes.js by\n\`node scripts/export-api-inventory.cjs\`. ${rows.length} live route registrations + ${retired.length} retired paths.\nThe response descriptions are maintained explicitly in the exporter; review them with handler changes.\n\nAdmin includes inherited prefix guards for /api/admin, /api/users, /api/coupons.\nAuthenticated owner means DB identity from JWT, with resource filters described in\n[permission matrix](permission-matrix.md). Business API routes require DB readiness (503); health/live remains available during DB outages.\nPayment responses intentionally have no success path until a provider is connected.\n\n| Method | Route | Access | Success / intentional disabled status | Response data |\n|---|---|---|---|---|\n`;
const markdown = header + rows.map(row => `| ${row.method} | \`${row.route}\` | ${row.access} | ${row.success} | ${row.response} |`).join('\n')
  + '\n\nRetired paths (all methods, all environments, every role):\n\n' + retired.map(route => `- \`${route}\`: 404; no bootstrap/reset/clear handler remains.`).join('\n')
  + '\n\nErrors: 400 invalid input/JSON, 401 missing/invalid/expired/deleted identity, 403 non-admin,\n404 missing/foreign resources, 409 conflict/state/version/duplicate coupon, 413 oversized JSON,\n503 database/payment/AI unavailable. See [validation rules](validation-rules.md).\n';
fs.writeFileSync(path.join(root, 'qa/docs/api-inventory.md'), markdown);
console.log(`${rows.length} route registrations exported`);
