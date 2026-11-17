const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const data = require('../../qa/test-data/catalog.json');
const { UserModel, ProductModel, OrderModel, VirtualClosetModel, SavedOutfitModel,
  TryonSessionModel, BannerContentModel, NewsletterModel } = require('../models');
const ids = { admin: '000000000000000000000101', customer: '000000000000000000000102', other: '000000000000000000000103',
  processingOrder: '000000000000000000000201', deliveredOrder: '000000000000000000000202',
  outfit: '000000000000000000000301', session: '000000000000000000000401' };
async function seed(handle) {
  const { runId, credentials } = await require('./owned-database').assertOwned(handle);
  const assets = [data.avatar, ...data.products.flatMap(p => Object.values(p.model3D?.sizes || {}).map(s => s.url))];
  for (const asset of assets) if (!fs.existsSync(path.join(__dirname, '../../client/public', asset))) throw new Error(`Fixture asset missing: ${asset}`);
  for (const [role, credential] of Object.entries(credentials)) {
    await UserModel.create({ _id: ids[role], ...credential, password: await bcrypt.hash(credential.password, 4),
      role: role === 'admin' ? 'admin' : 'user', fullName: `QA ${role}`, phone: '0900000000', address: 'Synthetic fixture address', createdAt: data.clock });
  }
  const products = await ProductModel.create(structuredClone(data.products));
  const shippingInfo = { fullName: 'QA Customer', phone: '0900000000', address: 'Synthetic fixture address' };
  const snapshot = { _id: '000000000000000000006201', productId: products[0].id, name: products[0].name, price: products[0].price, quantity: 1,
    color: 'White', size: 'M', selectedColor: 'White', selectedSize: 'M', model3D: products[0].model3D };
  // Deterministic historical snapshots do not claim a current stock reservation.
  await OrderModel.create([
    { _id: ids.processingOrder, userId: ids.customer, products: [snapshot], totalAmount: 230000, shippingFee: 30000, shippingMethod: 'standard', shippingInfo, status: 'Đang xử lý', createdAt: data.clock },
    { _id: ids.deliveredOrder, userId: ids.customer, products: [snapshot], totalAmount: 230000, shippingFee: 30000, shippingMethod: 'standard', shippingInfo, status: 'Đã giao', createdAt: data.clock },
  ]);
  const itemId = `qa-${runId}-shirt-m`;
  await VirtualClosetModel.create({ _id: '000000000000000000000302', userId: ids.customer, totalItems: 1, lastSyncedAt: data.clock, createdAt: data.clock, updatedAt: data.clock,
    items: [{ _id: '000000000000000000006301', itemId, orderId: ids.deliveredOrder, productId: products[0].id, name: products[0].name, category: 'Áo', price: 200000,
      size: 'M', color: 'White', glbUrl: snapshot.model3D.sizes.M.url, model3D: snapshot.model3D, dateAdded: data.clock, source: 'order' }] });
  await SavedOutfitModel.create({ _id: ids.outfit, userId: ids.customer, name: 'QA saved outfit', slots: { tops: { itemId, name: products[0].name } }, createdAt: data.clock });
  // Fresh TTL timestamp is intentional: a fixed historical timestamp would expire immediately.
  await TryonSessionModel.create({ _id: ids.session, items: [{ productId: products[0].id, size: 'M' }] });
  await BannerContentModel.create({ _id: '000000000000000000000501', bannerId: 'qa-welcome', title: 'QA catalog', content: 'Synthetic test data', createdAt: data.clock, updatedAt: data.clock });
  await NewsletterModel.create({ _id: '000000000000000000000601', email: credentials.customer.email, couponCode: 'NEWS10QA', createdAt: data.clock });
  return { version: data.version, ids, productIds: products.map(p => p.id), itemId, assets, counts: { users: 3, products: 3, orders: 2, closets: 1, outfits: 1, sessions: 1, banners: 1, newsletters: 1 } };
}
// No standalone CLI: writes must enter through the owned database reset guard.
module.exports = { seed, ids };
