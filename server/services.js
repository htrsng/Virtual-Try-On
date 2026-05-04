const transporter = require("./config/mailer");
const {
  ProductModel,
  BannerContentModel,
  VirtualClosetModel,
} = require("./models");

const allocateLegacyStock = (totalStock, colorCount, sizeCount) => {
  const safeColorCount = Math.max(1, Number(colorCount) || 1);
  const safeSizeCount = Math.max(1, Number(sizeCount) || 1);
  const safeTotalStock = Math.max(0, Number(totalStock) || 0);
  const totalSlots = safeColorCount * safeSizeCount;
  const baseStock = Math.floor(safeTotalStock / totalSlots);
  let remainder = safeTotalStock - baseStock * totalSlots;

  return Array.from({ length: safeColorCount }, () => (
    Array.from({ length: safeSizeCount }, () => {
      const stock = baseStock + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
      return stock;
    })
  ));
};

const buildLegacyProductVariants = (productObject) => {
  const colors = Array.isArray(productObject.colors) && productObject.colors.length > 0
    ? productObject.colors
    : ["Mặc định"];
  const sizes = Array.isArray(productObject.sizes) && productObject.sizes.length > 0
    ? productObject.sizes
    : ["Free Size"];
  const fallbackStock = Number(productObject.totalStock ?? productObject.stock) || 0;
  const stockMatrix = allocateLegacyStock(fallbackStock, colors.length, sizes.length);

  return colors.map((colorName, colorIndex) => ({
    color: {
      name: String(colorName || "Mặc định"),
      hex: "#888888",
      image: Array.isArray(productObject.images) && productObject.images.length > 0 ? productObject.images[0] : (productObject.img || ""),
    },
    sizes: sizes.map((size, sizeIndex) => ({
      size: String(size || "Free Size"),
      stock: stockMatrix[colorIndex]?.[sizeIndex] ?? 0,
      sku: "",
    })),
  }));
};

const normalizeProductForClient = (productDoc) => {
  const product = productDoc.toObject ? productDoc.toObject() : { ...productDoc };
  const numericId = Number(product.id);
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const legacyVariants = !hasVariants ? buildLegacyProductVariants(product) : product.variants;
  const fallbackStock = Number(product.totalStock ?? product.stock) || 0;

  return {
    ...product,
    id: Number.isInteger(numericId) && numericId > 0 ? numericId : product.id,
    variants: legacyVariants,
    stock: Number.isFinite(fallbackStock) ? fallbackStock : 0,
    totalStock: Number.isFinite(fallbackStock) ? fallbackStock : 0,
  };
};

async function sendOrderConfirmationEmail(userEmail, order, shippingInfo) {
  const productRows = order.products
    .map(
      (p) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${p.img ? `<img src="${p.img}" alt="${p.name}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;"/>` : ""}
          <span>${p.name}</span>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${Number(p.price).toLocaleString("vi-VN")}đ</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${(p.price * p.quantity).toLocaleString("vi-VN")}đ</td>
    </tr>
  `,
    )
    .join("");

  const discountRow =
    order.discountAmount > 0
      ? `
    <tr>
      <td colspan="3" style="padding: 8px 12px; text-align: right; color: #e74c3c;">Giảm giá (${order.discountCode}):</td>
      <td style="padding: 8px 12px; text-align: right; color: #e74c3c; font-weight: 600;">-${Number(order.discountAmount).toLocaleString("vi-VN")}đ</td>
    </tr>
  `
      : "";

  const voucherRow =
    order.voucherDiscount > 0
      ? `
    <tr>
      <td colspan="3" style="padding: 8px 12px; text-align: right; color: #e74c3c;">Voucher (${order.voucherCode}):</td>
      <td style="padding: 8px 12px; text-align: right; color: #e74c3c; font-weight: 600;">-${Number(order.voucherDiscount).toLocaleString("vi-VN")}đ</td>
    </tr>
  `
      : "";

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;">
    <div style="max-width:600px;margin:20px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #c8956c, #a0714f);padding:30px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:24px;">✅ ĐẶT HÀNG THÀNH CÔNG!</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Cảm ơn bạn đã mua sắm tại Shopee Fashion</p>
      </div>

      <div style="padding:25px;">
        <div style="background:#f8f9fa;border-radius:8px;padding:15px;margin-bottom:20px;">
          <p style="margin:0 0 5px;"><strong>Mã đơn hàng:</strong> ${order._id}</p>
          <p style="margin:0 0 5px;"><strong>Ngày đặt:</strong> ${new Date(order.createdAt).toLocaleString("vi-VN")}</p>
          <p style="margin:0 0 5px;"><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : order.paymentMethod === "banking" ? "Chuyển khoản ngân hàng" : "Thanh toán online"}</p>
          <p style="margin:0;"><strong>Trạng thái:</strong> <span style="color:#27ae60;font-weight:600;">Đang xử lý</span></p>
        </div>

        <h3 style="color:#333;margin:0 0 10px;">📦 Chi tiết đơn hàng</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f8f9fa;">
              <th style="padding:12px;text-align:left;">Sản phẩm</th>
              <th style="padding:12px;text-align:center;">SL</th>
              <th style="padding:12px;text-align:right;">Đơn giá</th>
              <th style="padding:12px;text-align:right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
          <tfoot>
            ${discountRow}
            ${voucherRow}
            <tr>
              <td colspan="3" style="padding:12px;text-align:right;font-size:16px;font-weight:700;color:#c8956c;">Tổng cộng:</td>
              <td style="padding:12px;text-align:right;font-size:18px;font-weight:700;color:#c8956c;">${Number(order.totalAmount).toLocaleString("vi-VN")}đ</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top:20px;background:#f0f7ff;border-radius:8px;padding:15px;border-left:4px solid #3498db;">
          <h3 style="color:#333;margin:0 0 10px;">🚚 Thông tin giao hàng</h3>
          <p style="margin:4px 0;"><strong>Người nhận:</strong> ${shippingInfo.fullName}</p>
          <p style="margin:4px 0;"><strong>SĐT:</strong> ${shippingInfo.phone}</p>
          <p style="margin:4px 0;"><strong>Địa chỉ:</strong> ${shippingInfo.address}${shippingInfo.ward ? ", " + shippingInfo.ward : ""}${shippingInfo.district ? ", " + shippingInfo.district : ""}${shippingInfo.city ? ", " + shippingInfo.city : ""}</p>
        </div>
      </div>

      <div style="background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #eee;">
        <p style="color:#888;font-size:13px;margin:0;">Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>
        <p style="color:#aaa;font-size:12px;margin:8px 0 0;">Shopee Fashion Vietnam © ${new Date().getFullYear()}</p>
      </div>
    </div>
  </body>
  </html>
  `;

  const mailOptions = {
    from: '"Shopee Fashion" <thanhtb2005@gmail.com>',
    to: userEmail,
    subject: `✅ Đặt hàng thành công - Đơn hàng #${order._id.toString().slice(-8).toUpperCase()}`,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✉️ Email xác nhận đã gửi tới: ${userEmail}`);
}

const normalizeProductNumericIds = async () => {
  const products = await ProductModel.find().sort({ _id: 1 });
  if (!products.length) {
    return {
      total: 0,
      updated: 0,
      message: "Không có sản phẩm để chuẩn hóa ID",
    };
  }

  const usedIds = new Set();
  let maxId = 0;

  products.forEach((product) => {
    const numericId = Number(product.id);
    if (
      Number.isInteger(numericId) &&
      numericId > 0 &&
      !usedIds.has(numericId)
    ) {
      usedIds.add(numericId);
      maxId = Math.max(maxId, numericId);
    }
  });

  const updates = [];
  const getNextId = () => {
    let candidate = Math.max(1, maxId + 1);
    while (usedIds.has(candidate)) {
      candidate += 1;
    }
    usedIds.add(candidate);
    maxId = Math.max(maxId, candidate);
    return candidate;
  };

  products.forEach((product) => {
    const numericId = Number(product.id);
    const isValid = Number.isInteger(numericId) && numericId > 0;
    if (!isValid || usedIds.has(`dup:${numericId}`)) {
      updates.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { id: getNextId() } },
        },
      });
    } else {
      usedIds.add(`dup:${numericId}`);
    }
  });

  if (updates.length > 0) {
    await ProductModel.bulkWrite(updates);
  }

  return {
    total: products.length,
    updated: updates.length,
    message: `Đã chuẩn hóa ID sản phẩm (${updates.length}/${products.length})`,
  };
};

const seedBannerContents = async () => {
  const defaults = [
    { bannerId: "banner1", title: "Ưu đãi hôm nay", content: "Giảm giá hấp dẫn cho các sản phẩm mới nhất.", imageUrl: "", isActive: true },
    { bannerId: "banner2", title: "Bộ sưu tập mới", content: "Khám phá phong cách mới cùng công nghệ thử đồ ảo.", imageUrl: "", isActive: true },
    { bannerId: "banner3", title: "Miễn phí vận chuyển", content: "Áp dụng cho đơn hàng từ 499K.", imageUrl: "", isActive: true },
  ];

  await Promise.all(
    defaults.map((banner) =>
      BannerContentModel.updateOne(
        { bannerId: banner.bannerId },
        { $setOnInsert: banner },
        { upsert: true },
      ),
    ),
  );
  console.log("✅ Seed banner contents done");
};

const syncOrderItemsToCloset = async (userId, orderId, products) => {
  try {
    if (!userId || !orderId || !products || products.length === 0) {
      console.log("⚠️ Skipping closet sync - missing required data");
      return;
    }

    let closet = await VirtualClosetModel.findOne({ userId });
    if (!closet) {
      closet = new VirtualClosetModel({ userId, items: [] });
    }

    const itemsToAdd = [];
    for (const product of products) {
      const itemId = `closet-${orderId}-${product.productId || product._id}`;
      const purchasedColor = String(product.color || product.selectedColor || product.variant?.color || "").trim();
      const purchasedSize = String(product.size || product.selectedSize || product.variant?.size || "").trim();

      const existingIndex = closet.items.findIndex((item) => item.itemId === itemId);
      if (existingIndex >= 0) {
        console.log(`⏭️ Item ${itemId} already exists in closet, skipping...`);
        continue;
      }

      const preservedCategory = String(product.category || "").trim() || inferProductCategory(product.name);

      itemsToAdd.push({
        itemId,
        orderId,
        productId: product.productId || product._id,
        name: product.name,
        category: preservedCategory,
        purchasedColor: purchasedColor || undefined,
        purchasedSize: purchasedSize || undefined,
        model3D: product.model3D || undefined,
        price: product.price,
        img: product.thumbnailUrl || product.imageUrl || product.img || product.image,
        imageUrl: product.imageUrl || product.thumbnailUrl || product.img || product.image,
        thumbnailUrl: product.thumbnailUrl || product.imageUrl || product.img || product.image,
        dateAdded: new Date(),
        source: "order",
        isActive: true,
        material: {
          preset: detectMaterialPreset(product.name),
          roughnessBias: 0.5,
          metallicFactor: 0,
          aoIntensity: 1,
        },
        model3D: { enabled: true, scale: 1 },
      });
    }

    if (itemsToAdd.length > 0) {
      closet.items.push(...itemsToAdd);
      closet.totalItems = closet.items.length;
      closet.lastSyncedAt = new Date();
      closet.updatedAt = new Date();
      await closet.save();

      console.log(`✅ Added ${itemsToAdd.length} items to closet for user ${userId}`);
      return { success: true, addedItems: itemsToAdd.length, closetId: closet._id };
    }

    console.log("ℹ️ No new items to add to closet");
    return { success: true, addedItems: 0 };
  } catch (err) {
    console.error("❌ Error syncing items to virtual closet:", err);
    return { success: false, error: err.message };
  }
};

function inferProductCategory(input) {
  const text = String(input || "").toLowerCase();

  if (text.includes("dress") || text.includes("đầm") || text.includes("váy liền")) {
    return "dresses";
  }
  if (text.includes("coat") || text.includes("jacket") || text.includes("blazer") || text.includes("hoodie") || text.includes("áo khoác")) {
    return "outerwear";
  }
  if (text.includes("pant") || text.includes("jean") || text.includes("skirt") || text.includes("short") || text.includes("quần") || text.includes("chân váy")) {
    return "bottoms";
  }

  return "tops";
}

function detectMaterialPreset(productName) {
  const text = String(productName || "").toLowerCase();

  if (text.includes("denim") || text.includes("jean") || text.includes("cotton")) {
    return "denim";
  }
  if (text.includes("silk") || text.includes("satin")) {
    return "satin";
  }
  if (text.includes("wool") || text.includes("cashmere")) {
    return "wool";
  }
  if (text.includes("knit") || text.includes("sweater")) {
    return "knit";
  }
  if (text.includes("linen")) {
    return "linen";
  }

  return "cotton";
}

module.exports = {
  sendOrderConfirmationEmail,
  normalizeProductNumericIds,
  seedBannerContents,
  syncOrderItemsToCloset,
  inferProductCategory,
  detectMaterialPreset,
  allocateLegacyStock,
  buildLegacyProductVariants,
  normalizeProductForClient,
};