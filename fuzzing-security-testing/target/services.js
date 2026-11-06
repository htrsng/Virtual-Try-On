/**
 * STUB services.js cho harness fuzzing Chuong 4.
 * File that (server/services.js) khong duoc cung cap trong pham vi
 * phan tich (chi tap trung Auth + Orders). Cac ham duoi day la no-op
 * AN TOAN (khong goi API/email that) nhung giu dung chu ky (signature)
 * de index.js that chay khong loi.
 */
module.exports = {
  sendOrderConfirmationEmail: async (_email, _order, _shippingInfo) => {
    return { skipped: true, reason: "stub - khong gui email that trong moi truong fuzzing" };
  },
  normalizeProductNumericIds: async () => ({ updated: 0 }),
  seedBannerContents: async () => ({ seeded: 0 }),
  syncOrderItemsToCloset: async () => ({ synced: 0 }),
  buildLegacyProductVariants: (product) => (product && product.variants) || [],
  normalizeProductForClient: (product) => product,
};
