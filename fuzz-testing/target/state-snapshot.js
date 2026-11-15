/* Evidence for supported mutations; this module never changes application state. */
const { createHash } = require('crypto');

function resourceForRequest(method, url, body = {}) {
  const verb = method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(verb)) return null;
  if (verb === 'POST' && url === '/api/auth/create-admin') return { collection: 'users', id: null };
  if (verb === 'POST' && url === '/api/orders') return { collection: 'orders', id: null };
  if (verb === 'POST' && url === '/api/products') return { collection: 'products', id: body?.id ?? null };
  const match = /^\/api\/(users|products|orders)\/([^/]+)(?:\/cancel)?$/.exec(url);
  return match ? { collection: match[1], id: match[2] } : null;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function rows(value, users = false) {
  if (!Array.isArray(value)) throw new Error('Snapshot collection is not an array');
  return clone(value).map(doc => {
    if (users && Object.hasOwn(doc, 'password')) {
      // Detect credential writes without disclosing a hash or plaintext in snapshots.
      doc.password_fingerprint = createHash('sha256').update(JSON.stringify(doc.password)).digest('hex');
      delete doc.password;
    }
    return doc;
  }).sort((left, right) => String(left._id).localeCompare(String(right._id)));
}

async function captureState(models, resource) {
  if (!resource) return null;
  if (resource.collection === 'users') return { users: rows(await models.UserModel.find({}), true) };
  if (resource.collection === 'products') return { products: rows(await models.ProductModel.find({})) };
  if (resource.collection === 'orders') return {
    orders: rows(await models.OrderModel.find({})),
    products: rows(await models.ProductModel.find({})),
    coupons: rows(await models.UsedCouponModel.find({})),
    notifications: rows(await models.NotificationModel.find({})),
  };
  throw new Error(`Unsupported snapshot resource: ${resource.collection}`);
}

function entityFromState(state, resource) {
  if (!resource || resource.id === null) return null;
  const key = resource.collection === 'products' ? 'id' : '_id';
  return state[resource.collection].find(doc => String(doc[key]) === String(resource.id)) || null;
}

module.exports = { resourceForRequest, captureState, entityFromState };
