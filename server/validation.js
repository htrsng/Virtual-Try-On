const objectId = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value, max = 200) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const money = value => Number.isSafeInteger(value) && value >= 0;
const email = value => text(value, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const password = value => typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value) <= 72;
function invalid(message) { const error = new Error(message); error.status = 400; error.code = 'INVALID_INPUT'; throw error; }
function ensure(condition, message) { if (!condition) invalid(message); }
function fields(body, allowed) {
  ensure(plain(body), 'JSON body must be an object');
  ensure(Object.keys(body).every(key => allowed.includes(key)), 'Unsupported field');
}
function rejectOperators(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    ensure(!key.startsWith('$') && !key.includes('.') && !['__proto__', 'constructor', 'prototype'].includes(key), 'Invalid input key');
    rejectOperators(item);
  }
}
function productInput(body, partial) {
  fields(body, ['id', 'name', 'description', 'price', 'originalPrice', 'img', 'images', 'category',
    'sold', 'rating', 'status', 'stock', 'totalStock', 'variants', 'model3D', 'ai_attributes', '__v']);
  if (!partial || body.name !== undefined) ensure(text(body.name), 'Product name is required');
  if (!partial || body.price !== undefined) ensure(money(body.price), 'price must be a nonnegative integer VND');
  for (const key of ['id', 'stock', 'totalStock', 'sold', 'originalPrice', '__v']) {
    if (body[key] !== undefined) ensure(money(body[key]) && (key !== 'id' || body[key] > 0), `Invalid ${key}`);
  }
  for (const key of ['description', 'category', 'img']) if (body[key] !== undefined) ensure(typeof body[key] === 'string' && body[key].length <= 10000, `Invalid ${key}`);
  if (body.status !== undefined) ensure(['active', 'inactive', 'out_of_stock'].includes(body.status), 'Invalid product status');
  if (body.rating !== undefined) ensure(typeof body.rating === 'number' && body.rating >= 0 && body.rating <= 5, 'Invalid rating');
  if (body.images !== undefined) ensure(Array.isArray(body.images) && body.images.length <= 30 && body.images.every(x => typeof x === 'string' && x.length <= 2000), 'Invalid images');
  if (body.variants !== undefined) {
    ensure(Array.isArray(body.variants) && body.variants.length <= 50, 'Invalid variants');
    const colors = new Set();
    for (const variant of body.variants) {
      ensure(plain(variant) && plain(variant.color) && text(variant.color.name) && Array.isArray(variant.sizes) && variant.sizes.length > 0 && variant.sizes.length <= 30, 'Invalid variant');
      ensure(!colors.has(variant.color.name), 'Duplicate color'); colors.add(variant.color.name);
      const sizes = new Set();
      for (const size of variant.sizes) {
        ensure(plain(size) && text(size.size, 30) && money(size.stock) && !sizes.has(size.size), 'Invalid or duplicate size stock');
        sizes.add(size.size);
      }
    }
  }
}
const profileFields = ['fullName', 'phone', 'address', 'city', 'district', 'ward'];
function profile(body, admin = false) {
  fields(body, [...profileFields, ...(admin ? ['email', 'role', '__v'] : [])]);
  for (const key of profileFields) if (body[key] !== undefined) ensure(typeof body[key] === 'string' && body[key].length <= 500, `Invalid ${key}`);
  if (body.email !== undefined) ensure(email(body.email) && body.email === body.email.trim().toLowerCase(), 'Invalid normalized email');
  if (body.role !== undefined) ensure(['admin', 'user'].includes(body.role), 'Invalid role');
}
function validateRequest(req, res, next) {
  try {
    rejectOperators(req.body); rejectOperators(req.query);
    for (const [key, value] of Object.entries(req.query)) ensure(/^[a-zA-Z][\w-]*$/.test(key) && typeof value === 'string' && value.length <= 500, 'Query keys and values must be scalar strings');
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) ensure(plain(req.body), 'JSON body must be an object');
    // Express defaults accept case variants and trailing slashes. Validation must cover them too.
    const body = req.body || {}; const url = req.path.toLowerCase().replace(/\/+$/, '') || '/'; const write = ['POST', 'PUT', 'PATCH'].includes(req.method);
    const mongoPath = /^\/api\/(?:users|orders|saved-outfits)\/([^/]+)/.exec(url);
    if (mongoPath && !['my-orders'].includes(mongoPath[1])) ensure(objectId(mongoPath[1]), 'Invalid resource id');
    for (const pattern of [/^\/api\/user\/addresses\/([^/]+)/, /^\/api\/admin\/chat\/messages\/([^/]+)/, /^\/api\/tryon\/session\/([^/]+)/]) {
      const match = pattern.exec(url); if (match) ensure(objectId(match[1]), 'Invalid resource id');
    }
    const likePath = /^\/api\/reviews\/([^/]+)\/like$/.exec(url);
    if (likePath) ensure(objectId(likePath[1]), 'Invalid review id');
    if (write && /^\/api\/products(?:\/[^/]+)?$/.test(url)) productInput(body, req.method !== 'POST');
    if (write && /^\/api\/users\/[^/]+$/.test(url)) profile(body, true);
    if (write && url === '/api/auth/profile') profile(body);
    if (write && /^\/api\/user\/addresses/.test(url)) {
      fields(body, ['fullName', 'phone', 'province', 'district', 'ward', 'street', 'isDefault', 'type']);
      for (const key of ['fullName', 'phone', 'province', 'district', 'ward', 'street']) ensure(text(body[key], 500), `Invalid ${key}`);
      if (body.type !== undefined) ensure(['home', 'office'].includes(body.type), 'Invalid address type');
      if (body.isDefault !== undefined) ensure(typeof body.isDefault === 'boolean', 'Invalid default flag');
    }
    if (write && /^\/api\/banner-contents/.test(url)) {
      fields(body, ['bannerId', 'title', 'content', 'imageUrl', 'isActive']);
      for (const key of (req.method === 'POST' ? ['bannerId', 'title', 'content'] : ['title', 'content'].filter(k => body[k] !== undefined))) ensure(text(body[key], 10000), `Invalid ${key}`);
      if (body.isActive !== undefined) ensure(typeof body.isActive === 'boolean', 'Invalid banner state');
    }
    if (write && ['/api/chat/send', '/api/admin/chat/reply'].includes(url)) ensure(text(body.message, 2000), 'Invalid chat message');
    if (write && url === '/api/reviews') ensure((money(body.productId) && body.productId > 0 || objectId(body.productId)) && Number.isInteger(body.rating) && body.rating >= 1 && body.rating <= 5 && (body.comment === undefined || typeof body.comment === 'string' && body.comment.length <= 2000), 'Invalid review');
    if (write && url === '/api/tryon/session') ensure(Array.isArray(body.items) && body.items.length > 0 && body.items.length <= 20 && body.items.every(item => plain(item) && (objectId(item.productId) || Number.isSafeInteger(item.productId) && item.productId > 0) && (item.size === undefined || text(item.size, 30))), 'Invalid session items');
    if (url === '/api/recommendations' && req.query.limit !== undefined) ensure(/^\d+$/.test(req.query.limit) && Number(req.query.limit) >= 1 && Number(req.query.limit) <= 50, 'limit must be 1..50');
    if (write && url === '/api/wishlist/add') ensure(plain(body.product) && (objectId(body.product.id || body.product.productId) || money(body.product.id || body.product.productId)), 'Invalid wishlist product');
    if (write && url === '/api/wishlist/sync') ensure(Array.isArray(body.localProducts) && body.localProducts.length <= 100 && body.localProducts.every(p => plain(p) && (objectId(p.id || p.productId) || money(p.id || p.productId))), 'Invalid wishlist items');
    if (write && url === '/api/view-history') ensure((objectId(body.productId) || Number.isSafeInteger(body.productId) && body.productId > 0) && (body.category === undefined || typeof body.category === 'string' && body.category.length <= 200), 'Invalid view history');
    if (write && url === '/api/virtual-closet/add') {
      ensure((objectId(body.productId) || Number.isSafeInteger(body.productId) && body.productId > 0) && text(body.name) && text(body.category) && (body.price === undefined || money(body.price)), 'Invalid import item');
      for (const key of ['img', 'imageUrl', 'thumbnailUrl']) if (body[key] !== undefined) ensure(typeof body[key] === 'string' && body[key].length <= 2000, 'Invalid image URL');
    }
    if (write && url === '/api/saved-outfits') {
      fields(body, ['name', 'slots']);
      if (body.name !== undefined) ensure(text(body.name), 'Invalid outfit name');
      ensure(plain(body.slots) && Object.keys(body.slots).length <= 4, 'Invalid outfit slots');
      for (const [slot, item] of Object.entries(body.slots)) {
        ensure(['tops', 'bottoms', 'outerwear', 'dresses'].includes(slot) && plain(item), 'Invalid outfit slot');
        fields(item, ['itemId', 'name', 'thumbnailUrl']);
        ensure(text(item.itemId, 200), 'Invalid outfit item');
      }
    }
    next();
  } catch (error) { next(error); }
}
function sendError(res, error) {
  if (error.code === 20 && /Transaction numbers/.test(error.message)) return res.status(503).json({ code: 'REPLICA_SET_REQUIRED', error: 'Checkout requires a MongoDB replica set' });
  const status = error.status || (['ValidationError', 'CastError'].includes(error.name) ? 400 : error.code === 11000 || error.name === 'VersionError' ? 409 : 500);
  return res.status(status).json({ code: status === 500 ? 'INTERNAL_ERROR' : error.code === 11000 ? 'CONFLICT' : error.code || 'INVALID_INPUT',
    error: status >= 500 ? 'Internal server error' : error.name === 'CastError' ? 'Invalid input' : error.code === 11000 ? 'Resource already exists' : error.message });
}
const safeUser = user => {
  const source = user.toObject ? user.toObject() : user;
  return { ...Object.fromEntries(['_id', 'email', 'role', ...profileFields, 'addresses', 'createdAt', '__v'].filter(k => source[k] !== undefined).map(k => [k, source[k]])), id: String(source._id) };
};
module.exports = { objectId, plain, text, money, email, password, ensure, fields, validateRequest, sendError, safeUser };
