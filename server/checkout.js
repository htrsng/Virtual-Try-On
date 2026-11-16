const mongoose = require('mongoose');
const { ProductModel, OrderModel, UserModel, NewsletterModel, UsedCouponModel } = require('./models');
const { objectId, text, money, plain, ensure, fields } = require('./validation');

const shipping = { standard: 30000, express: 50000, super: 100000 };
const aliases = { 'Tiêu chuẩn': 'standard', 'Standard': 'standard', 'Giao hàng tiêu chuẩn': 'standard',
  'Nhanh': 'express', 'Express': 'express', 'Giao hàng nhanh': 'express',
  'Hỏa tốc': 'super', 'Super Express': 'super', 'Giao hàng hỏa tốc': 'super',
  'Standard Shipping': 'standard', 'Express Shipping': 'express', 'Super Fast Shipping': 'super', 'Giao hàng siêu tốc': 'super' };
const coupons = { GIAM10: [0, 10], GIAM15: [200000, 15], GIAM20: [500000, 20], GIAM30: [1000000, 30], GIAM50: [2000000, 50] };
// This catalog is server-owned. Browser localStorage cannot define promotions.
const vouchers = {
  SAVE10: [50000, 'percent', 10, 50000], SAVE20: [100000, 'percent', 20, 100000],
  SAVE30: [200000, 'percent', 30, 150000], FREESHIP: [100000, 'shipping', 0, 100000],
  FLASH50K: [100000, 'fixed', 50000, 50000], NEWBIE100: [300000, 'fixed', 100000, 100000],
};
const promotionExpiry = new Date('2027-01-01T00:00:00+07:00');
const normalizeCode = value => {
  ensure(value === undefined || value === null || typeof value === 'string' && value.length <= 50, 'Invalid promotion code');
  return String(value || '').trim().toUpperCase();
};
async function createOrder(userId, body) {
  fields(body, ['products', 'shippingInfo', 'shippingMethod', 'paymentMethod', 'discountCode', 'voucherCode',
    'totalAmount', 'shippingFee', 'discountAmount', 'voucherDiscount']);
  ensure(Array.isArray(body.products) && body.products.length > 0 && body.products.length <= 100, 'Cart must contain 1..100 items');
  ensure(plain(body.shippingInfo), 'shippingInfo is required');
  fields(body.shippingInfo, ['fullName', 'phone', 'address', 'city', 'district', 'ward']);
  for (const key of ['fullName', 'phone', 'address']) ensure(text(body.shippingInfo[key], 500), `Invalid shipping ${key}`);
  ensure(/^[+\d][\d ()-]{7,19}$/.test(body.shippingInfo.phone), 'Invalid shipping phone');
  for (const key of ['city', 'district', 'ward']) if (body.shippingInfo[key] !== undefined) ensure(typeof body.shippingInfo[key] === 'string' && body.shippingInfo[key].length <= 200, `Invalid shipping ${key}`);
  const method = aliases[body.shippingMethod] || body.shippingMethod || 'standard';
  ensure(Object.hasOwn(shipping, method), 'Unknown shipping method');
  const paymentMethod = body.paymentMethod || 'COD';
  ensure(['COD', 'banking', 'Online', 'momo', 'zalopay', 'vnpay', 'stripe'].includes(paymentMethod), 'Invalid payment method');
  // No real gateway exists. Never accept a browser assertion that online payment succeeded.
  if (!['COD', 'banking'].includes(paymentMethod)) {
    const error = new Error('Online payment is not configured; use COD or bank transfer'); error.status = 503; throw error;
  }
  const discountCode = normalizeCode(body.discountCode); const voucherCode = normalizeCode(body.voucherCode);
  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      const products = []; let subtotal = 0;
      for (const item of body.products) {
        ensure(plain(item) && (objectId(item.productId) || Number.isSafeInteger(item.productId) && item.productId > 0), 'Invalid productId');
        ensure(Number.isSafeInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 100, 'quantity must be 1..100');
        const product = await ProductModel.findOne(objectId(item.productId) ? { _id: item.productId } : { id: item.productId }).session(session);
        ensure(product && product.status === 'active', 'Product is unavailable');
        ensure(money(product.price) && product.price <= 1000000000, 'Product has invalid catalog price');
        const color = item.selectedColor ?? item.color ?? item.variant?.color;
        const size = item.selectedSize ?? item.size ?? item.variant?.size;
        ensure(color === undefined || text(color, 100), 'Invalid selected color');
        ensure(size === undefined || text(size, 30), 'Invalid selected size');
        if (product.variants.length) {
          const variant = product.variants.find(v => v.color.name === color || v.color.hex === color);
          const selected = variant?.sizes.find(s => s.size === size);
          ensure(selected && selected.stock >= item.quantity, 'Variant unavailable or insufficient stock');
          selected.stock -= item.quantity;
        } else {
          ensure(product.stock >= item.quantity, 'Insufficient stock'); product.stock -= item.quantity; product.totalStock = product.stock;
        }
        product.increment();
        await product.save({ session });
        subtotal += product.price * item.quantity;
        ensure(Number.isSafeInteger(subtotal) && subtotal <= 1000000000000, 'Order amount exceeds limit');
        products.push({ productId: product.id || String(product._id), name: product.name, price: product.price,
          quantity: item.quantity, img: product.img, model3D: product.model3D, color, size, selectedColor: color, selectedSize: size });
      }
      let discountAmount = 0; let voucherDiscount = 0;
      const user = await UserModel.findById(userId).session(session);
      ensure(user, 'User unavailable');
      if (discountCode) {
        const policy = coupons[discountCode];
        if (policy) {
          ensure(subtotal >= policy[0], 'Coupon minimum not met');
          discountAmount = Math.floor(subtotal * policy[1] / 100);
        } else {
          ensure(/^NEWS10[A-Z0-9]+$/.test(discountCode), 'Unknown coupon');
          const claimed = await NewsletterModel.updateOne({ email: user.email, couponCode: discountCode, isUsed: false }, { $set: { isUsed: true } }, { session });
          ensure(claimed.modifiedCount === 1, 'Newsletter coupon unavailable');
          discountAmount = Math.floor(subtotal / 10);
        }
      }
      if (voucherCode) {
        ensure(new Date() < promotionExpiry, 'Voucher expired');
        const policy = vouchers[voucherCode]; ensure(policy, 'Voucher unavailable or eligibility not supported');
        ensure(subtotal >= policy[0], 'Voucher minimum not met');
        if (voucherCode === 'NEWBIE100') ensure(await OrderModel.countDocuments({ userId }).session(session) === 0, 'First-order voucher only');
        voucherDiscount = Math.min(policy[3], policy[1] === 'percent' ? Math.floor(subtotal * policy[2] / 100) : policy[1] === 'shipping' ? shipping[method] : policy[2]);
      }
      // Promotions cannot create a negative payable amount.
      voucherDiscount = Math.min(voucherDiscount, subtotal + shipping[method] - discountAmount);
      [order] = await OrderModel.create([{ userId, products, inventoryReserved: true, totalAmount: subtotal + shipping[method] - discountAmount - voucherDiscount,
        discountCode, discountAmount, voucherCode, voucherDiscount, shippingFee: shipping[method], shippingMethod: method,
        shippingInfo: body.shippingInfo, paymentMethod }], { session });
      for (const code of new Set([discountCode, voucherCode].filter(Boolean))) {
        await UsedCouponModel.create([{ userId, couponCode: code, orderId: order._id }], { session });
      }
    });
    return order;
  } finally { await session.endSession(); }
}
async function changeOrderStatus(id, status, expectedVersion, ownerId, reason) {
  ensure(['Đang xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'].includes(status), 'Invalid order status');
  ensure(expectedVersion === undefined || money(expectedVersion), 'Invalid version');
  const session = await mongoose.startSession(); let updated;
  try {
    await session.withTransaction(async () => {
      const order = await OrderModel.findOne({ _id: id, ...(ownerId ? { userId: ownerId } : {}) }).select('+inventoryReserved').session(session);
      if (!order) { const error = new Error('Order not found'); error.status = 404; throw error; }
      if (expectedVersion !== undefined && order.__v !== expectedVersion) { const error = new Error('Stale version; reload before updating'); error.status = 409; throw error; }
      const transitions = { 'Đang xử lý': ['Đang giao', 'Đã hủy'], 'Đang giao': ['Đã giao'], 'Đã giao': [], 'Đã hủy': [] };
      if (!transitions[order.status]?.includes(status)) { const error = new Error('Invalid order status transition'); error.status = 409; throw error; }
      if (status === 'Đã hủy' && order.inventoryReserved) {
        for (const item of order.products) {
          const product = await ProductModel.findOne(objectId(item.productId) ? { _id: item.productId } : { id: item.productId }).session(session);
          // Missing products do not prevent cancellation of a historical order.
          if (!product) continue;
          if (product.variants.length) {
            const variant = product.variants.find(v => v.color.name === item.color || v.color.hex === item.color);
            const size = variant?.sizes.find(s => s.size === item.size);
            if (size) size.stock += item.quantity;
          } else { product.stock += item.quantity; product.totalStock = product.stock; }
          product.increment();
          await product.save({ session });
        }
        order.inventoryReserved = false;
      }
      if (status === 'Đã hủy') { order.cancelledAt = new Date(); order.cancelReason = reason || 'Khách hàng hủy đơn'; }
      order.status = status; order.increment(); await order.save({ session }); updated = order;
    });
    return updated;
  } finally { await session.endSession(); }
}
module.exports = { createOrder, changeOrderStatus, shipping, coupons, vouchers };
