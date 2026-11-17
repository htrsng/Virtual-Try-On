const request = require('supertest');
const app = require('../index');
const { actor, product, shippingInfo } = require('./helpers');
const { OrderModel, ProductModel, UsedCouponModel, NewsletterModel } = require('../models');
async function fixture(overrides = {}) {
  const user = await actor(); const item = await product(overrides);
  const payload = { products: [{ productId: item.id, quantity: 1 }], shippingInfo, shippingMethod: 'standard' };
  const submit = data => request(app).post('/api/orders').auth(user.token, { type: 'bearer' }).send({ ...payload, ...data });
  return { ...user, item, payload, submit };
}
describe('Server checkout contract and persistence', () => {
  test.each([0, -1, 1.5, '2', null, 101])('invalid quantity %p creates no order and preserves stock', async quantity => {
    const f = await fixture();
    expect((await f.submit({ products: [{ productId: f.item.id, quantity }] })).status).toBe(400);
    expect(await OrderModel.countDocuments()).toBe(0); expect((await ProductModel.findById(f.item._id)).stock).toBe(20);
  });
  test.each(['unknown', 'GIAM50'])('invalid/ineligible coupon %s rolls back inventory', async discountCode => {
    const f = await fixture(); expect((await f.submit({ discountCode })).status).toBe(400);
    expect(await OrderModel.countDocuments()).toBe(0); expect((await ProductModel.findById(f.item._id)).stock).toBe(20);
  });
  test.each([['standard', 30000], ['express', 50000], ['super', 100000]])('server shipping %s', async (shippingMethod, fee) => {
    const f = await fixture(); const res = await f.submit({ shippingMethod, shippingFee: 0 });
    expect(res.status).toBe(201); expect(res.body.order.totalAmount).toBe(200000 + fee);
    expect(res.body.order.shippingFee).toBe(fee);
  });
  test('coupon and voucher discount use server definitions and persist usage', async () => {
    const f = await fixture(); const res = await f.submit({ discountCode: ' giam10 ', voucherCode: 'SAVE20', discountAmount: 1, voucherDiscount: 1 });
    expect(res.status).toBe(201); expect(res.body.order).toMatchObject({ totalAmount: 170000, discountAmount: 20000, voucherDiscount: 40000 });
    expect(await UsedCouponModel.countDocuments({ userId: f.user._id })).toBe(2);
    const usage = await request(app).get('/api/used-coupons').auth(f.token, { type: 'bearer' });
    expect(usage.status).toBe(200); expect(usage.body.coupons.sort()).toEqual(['GIAM10', 'SAVE20']);
    const saved = await OrderModel.findById(res.body.order._id); expect(saved.totalAmount).toBe(170000);
    expect((await ProductModel.findById(f.item._id)).__v).toBe(1);
  });
  test('freeship is capped at actual shipping cost', async () => {
    const f = await fixture(); const res = await f.submit({ voucherCode: 'FREESHIP' });
    expect(res.status).toBe(201); expect(res.body.order.voucherDiscount).toBe(30000); expect(res.body.order.totalAmount).toBe(200000);
  });
  test('unverified eligibility vouchers and client storage codes are rejected', async () => {
    const f = await fixture(); expect((await f.submit({ voucherCode: 'VIP15' })).status).toBe(400);
    expect((await f.submit({ voucherCode: 'LOCALSTORAGE99' })).status).toBe(400);
  });
  test('newsletter coupon belongs to authenticated email and is consumed once', async () => {
    const f = await fixture();
    await NewsletterModel.create({ email: 'other@example.test', couponCode: 'NEWS10QA' });
    expect((await f.submit({ discountCode: 'NEWS10QA' })).status).toBe(400);
    await NewsletterModel.updateOne({}, { email: f.user.email });
    const res = await f.submit({ discountCode: 'NEWS10QA' }); expect(res.status).toBe(201);
    expect((await NewsletterModel.findOne({})).isUsed).toBe(true);
    expect((await f.submit({ discountCode: 'NEWS10QA' })).status).toBe(400);
  });
  test('concurrent same coupon yields one order and one inventory decrement', async () => {
    const f = await fixture(); const replies = await Promise.all([f.submit({ discountCode: 'GIAM10' }), f.submit({ discountCode: 'GIAM10' })]);
    expect(replies.map(r => r.status).sort()).toEqual([201, 409]);
    expect(await OrderModel.countDocuments()).toBe(1); expect(await UsedCouponModel.countDocuments()).toBe(1);
    expect((await ProductModel.findById(f.item._id)).stock).toBe(19);
  });
  test('concurrent buyers cannot oversell last unit', async () => {
    const f = await fixture({ stock: 1 }); const other = await actor();
    const replies = await Promise.all([f.submit({}), request(app).post('/api/orders').auth(other.token, { type: 'bearer' }).send(f.payload)]);
    expect(replies.map(r => r.status).sort()).toEqual([201, 400]);
    expect(await OrderModel.countDocuments()).toBe(1); expect((await ProductModel.findById(f.item._id)).stock).toBe(0);
  });
  test('variant selection controls stock and snapshot uses catalog model', async () => {
    const f = await fixture({ model3D: { url: '/trusted.glb' }, variants: [{ color: { name: 'Red', hex: '#ff0000' }, sizes: [{ size: 'M', stock: 2 }] }] });
    expect((await f.submit({ products: [{ productId: f.item.id, quantity: 1, color: 'Blue', size: 'M' }] })).status).toBe(400);
    const res = await f.submit({ products: [{ productId: f.item.id, quantity: 2, color: 'Red', size: 'M', model3D: { url: '/forged.glb' } }] });
    expect(res.status).toBe(201); expect(res.body.order.products[0].model3D.url).toBe('/trusted.glb');
    expect((await ProductModel.findById(f.item._id)).stock).toBe(0);
  });
  test('cancellation is owner scoped and restores stock exactly once', async () => {
    const f = await fixture(); const other = await actor(); const placed = await f.submit({ discountCode: 'GIAM10' });
    expect(placed.status).toBe(201); const url = `/api/orders/${placed.body.order._id}/cancel`;
    expect((await request(app).put(url).auth(other.token, { type: 'bearer' }).send({})).status).toBe(404);
    const replies = await Promise.all([1, 2].map(() => request(app).put(url).auth(f.token, { type: 'bearer' }).send({})));
    expect(replies.map(r => r.status).sort()).toEqual([200, 409]);
    expect((await ProductModel.findById(f.item._id)).stock).toBe(20);
    expect(await UsedCouponModel.countDocuments()).toBe(1);
  });
  test('order transitions reject unknown, skipped and terminal changes', async () => {
    const f = await fixture(); const admin = await actor('admin'); const placed = await f.submit({});
    const url = `/api/orders/${placed.body.order._id}`;
    const update = data => request(app).put(url).auth(admin.token, { type: 'bearer' }).send(data);
    expect((await update({ status: 'paid' })).status).toBe(400);
    expect((await update({ status: 'Đã giao' })).status).toBe(409);
    expect((await update({ status: 'Đang giao', __v: 0 })).status).toBe(200);
    expect((await update({ status: 'Đã giao', __v: 0 })).status).toBe(409);
    expect((await update({ status: 'Đã giao', __v: 1 })).status).toBe(200);
    expect((await update({ status: 'Đang xử lý' })).status).toBe(409);
    expect((await request(app).delete(url).auth(admin.token, { type: 'bearer' })).status).toBe(405);
  });
  test('historical order without stock reservation does not invent stock on cancel', async () => {
    const f = await fixture();
    const legacy = await OrderModel.create({ userId: f.user._id, products: [{ productId: f.item.id, quantity: 2 }], totalAmount: 400000 });
    const res = await request(app).put(`/api/orders/${legacy._id}/cancel`).auth(f.token, { type: 'bearer' }).send({});
    expect(res.status).toBe(200); expect((await ProductModel.findById(f.item._id)).stock).toBe(20);
    expect(res.body.order).not.toHaveProperty('inventoryReserved');
  });
  test('product holding reserved orders cannot be deleted or renumbered', async () => {
    const f = await fixture(); const admin = await actor('admin');
    expect((await f.submit({})).status).toBe(201);
    expect((await request(app).delete('/api/products/101').auth(admin.token, { type: 'bearer' })).status).toBe(409);
    expect((await request(app).put('/api/products/101').auth(admin.token, { type: 'bearer' }).send({ id: 102 })).status).toBe(400);
  });
  test.each([{ shippingMethod: 'free' }, { shippingInfo: { fullName: {}, phone: '0901234567', address: 'a' } }, { products: [] }, { products: [{ productId: 999, quantity: 1 }] }, { paymentMethod: 'typo' }])('invalid checkout %j is predictable', async data => {
    const f = await fixture(); expect((await f.submit(data)).status).toBe(400); expect(await OrderModel.countDocuments()).toBe(0);
  });
  test('online payment is unavailable instead of fabricated success', async () => {
    const f = await fixture(); expect((await f.submit({ paymentMethod: 'Online' })).status).toBe(503);
    const placed = await f.submit({});
    expect((await request(app).post('/api/payment/create').auth(f.token, { type: 'bearer' }).send({ orderId: placed.body.order._id, amount: 1, method: 'momo' })).status).toBe(503);
    expect((await OrderModel.findById(placed.body.order._id)).paymentMethod).toBe('COD');
  });
});
