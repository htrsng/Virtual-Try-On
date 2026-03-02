const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// JWT Secret Key
const JWT_SECRET = "your-secret-key-change-this-in-production";

// --- CẤU HÌNH EMAIL (Nodemailer) ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "thanhtb2005@gmail.com",
    pass: "xndu nxcu wuea aizn",
  },
});

// Verify email transporter khi server khởi động
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter lỗi:", error.message);
  } else {
    console.log("✅ Email transporter sẵn sàng gửi mail!");
  }
});

// Hàm gửi email xác nhận đơn hàng
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
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #c8956c, #a0714f);padding:30px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:24px;">✅ ĐẶT HÀNG THÀNH CÔNG!</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Cảm ơn bạn đã mua sắm tại Shopee Fashion</p>
      </div>

      <!-- Order Info -->
      <div style="padding:25px;">
        <div style="background:#f8f9fa;border-radius:8px;padding:15px;margin-bottom:20px;">
          <p style="margin:0 0 5px;"><strong>Mã đơn hàng:</strong> ${order._id}</p>
          <p style="margin:0 0 5px;"><strong>Ngày đặt:</strong> ${new Date(order.createdAt).toLocaleString("vi-VN")}</p>
          <p style="margin:0 0 5px;"><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : order.paymentMethod === "banking" ? "Chuyển khoản ngân hàng" : "Thanh toán online"}</p>
          <p style="margin:0;"><strong>Trạng thái:</strong> <span style="color:#27ae60;font-weight:600;">Đang xử lý</span></p>
        </div>

        <!-- Products Table -->
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

        <!-- Shipping Info -->
        <div style="margin-top:20px;background:#f0f7ff;border-radius:8px;padding:15px;border-left:4px solid #3498db;">
          <h3 style="color:#333;margin:0 0 10px;">🚚 Thông tin giao hàng</h3>
          <p style="margin:4px 0;"><strong>Người nhận:</strong> ${shippingInfo.fullName}</p>
          <p style="margin:4px 0;"><strong>SĐT:</strong> ${shippingInfo.phone}</p>
          <p style="margin:4px 0;"><strong>Địa chỉ:</strong> ${shippingInfo.address}${shippingInfo.ward ? ", " + shippingInfo.ward : ""}${shippingInfo.district ? ", " + shippingInfo.district : ""}${shippingInfo.city ? ", " + shippingInfo.city : ""}</p>
        </div>
      </div>

      <!-- Footer -->
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

// Kết nối MongoDB với kiểm tra chi tiết
mongoose
  .connect(
    "mongodb+srv://thanhtb2005:thanhthcsldp1@cluster.awvl3k3.mongodb.net/virtual-try-on?retryWrites=true&w=majority",
  )
  .then(() => {
    console.log("✅ Đã kết nối thành công đến MongoDB Atlas!");
    console.log("📊 Database:", mongoose.connection.name);
    console.log("🔗 Host:", mongoose.connection.host);
    console.log("📡 Connection state:", mongoose.connection.readyState); // 1 = connected
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối MongoDB Atlas:", err);
    process.exit(1);
  });

// Theo dõi trạng thái database
mongoose.connection.on("connected", () => {
  console.log("🟢 MongoDB connected");
  seedBannerContents().catch((err) =>
    console.error("❌ Seed banner contents error:", err),
  );
  normalizeProductNumericIds()
    .then((result) => console.log(`✅ ${result.message}`))
    .catch((err) => console.error("❌ Normalize product IDs error:", err));
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🟠 MongoDB disconnected");
});

// --- SCHEMA SẢN PHẨM ---
const ProductSchema = new mongoose.Schema({
  id: Number, // ID numeric tự tăng
  name: String,
  price: Number,
  img: String,
  category: String,
  sold: Number,
});
const ProductModel = mongoose.model("products", ProductSchema);

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

// --- SCHEMA NGƯỜI DÙNG ---
const UserSchema = new mongoose.Schema({
  id: Number, // ID numeric tự tăng
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" }, // 'admin' hoặc 'user'
  fullName: { type: String, default: "" },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  district: { type: String, default: "" },
  ward: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});
const UserModel = mongoose.model("users", UserSchema);

// --- SCHEMA ĐƠN HÀNG ---
const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  products: [
    {
      productId: { type: mongoose.Schema.Types.Mixed }, // Chấp nhận cả ObjectId và Number
      name: String,
      price: Number,
      quantity: Number,
      img: String,
    },
  ],
  totalAmount: { type: Number, required: true },
  discountCode: { type: String, default: "" },
  discountAmount: { type: Number, default: 0 },
  voucherCode: { type: String, default: "" },
  voucherDiscount: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  shippingMethod: { type: String, default: "Tiêu chuẩn" },
  shippingInfo: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    district: String,
    ward: String,
  },
  paymentMethod: { type: String, default: "COD" },
  status: { type: String, default: "Đang xử lý" }, // Đang xử lý, Đã giao, Đã hủy
  createdAt: { type: Date, default: Date.now },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
});
const OrderModel = mongoose.model("orders", OrderSchema);

// --- SCHEMA WISHLIST (ĐỒNG BỘ SERVER) ---
const WishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  products: [
    {
      productId: { type: mongoose.Schema.Types.Mixed },
      name: String,
      price: Number,
      img: String,
      category: String,
      addedAt: { type: Date, default: Date.now },
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});
WishlistSchema.index({ userId: 1 }, { unique: true });
const WishlistModel = mongoose.model("wishlists", WishlistSchema);

// --- SCHEMA ĐÁNH GIÁ SẢN PHẨM (REVIEW) ---
const ReviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.Mixed, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  userName: { type: String, default: "Ẩn danh" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  images: [String],
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
const ReviewModel = mongoose.model("reviews", ReviewSchema);

// --- SCHEMA CHAT (HỖ TRỢ KHÁCH HÀNG) ---
const ChatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  sender: { type: String, enum: ["user", "bot", "admin"], default: "user" },
  message: { type: String, required: true },
  type: { type: String, enum: ["text", "image", "product"], default: "text" },
  metadata: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const ChatMessageModel = mongoose.model("chat_messages", ChatMessageSchema);

// --- SCHEMA THÔNG BÁO (NOTIFICATION) ---
const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["order", "promo", "system", "cart_reminder"],
    default: "system",
  },
  link: { type: String, default: "" },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const NotificationModel = mongoose.model("notifications", NotificationSchema);

// --- SCHEMA LỊCH SỬ XEM SẢN PHẨM (cho gợi ý thông minh) ---
const ViewHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  productId: { type: mongoose.Schema.Types.Mixed, required: true },
  category: { type: String },
  viewCount: { type: Number, default: 1 },
  lastViewedAt: { type: Date, default: Date.now },
});
ViewHistorySchema.index({ userId: 1, productId: 1 }, { unique: true });
const ViewHistoryModel = mongoose.model("view_histories", ViewHistorySchema);

// --- SCHEMA NEWSLETTER (MỚI) ---
const NewsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  couponCode: { type: String, required: true },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const NewsletterModel = mongoose.model("newsletters", NewsletterSchema);

// --- SCHEMA USED COUPONS (tracking mã giảm giá đã sử dụng) ---
const UsedCouponSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  couponCode: { type: String, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "orders" },
  usedAt: { type: Date, default: Date.now },
});
UsedCouponSchema.index({ userId: 1, couponCode: 1 }, { unique: true });
const UsedCouponModel = mongoose.model("usedcoupons", UsedCouponSchema);

// --- SCHEMA BANNER CONTENT (MỚI) ---
const BannerContentSchema = new mongoose.Schema({
  bannerId: { type: String, required: true, unique: true }, // banner1, banner2, banner3
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const BannerContentModel = mongoose.model(
  "banner_contents",
  BannerContentSchema,
);

// --- SEED BANNER CONTENT (đảm bảo có dữ liệu mặc định) ---
const seedBannerContents = async () => {
  const defaults = [
    {
      bannerId: "banner1",
      title: "Ưu đãi hôm nay",
      content: "Giảm giá hấp dẫn cho các sản phẩm mới nhất.",
      imageUrl: "",
      isActive: true,
    },
    {
      bannerId: "banner2",
      title: "Bộ sưu tập mới",
      content: "Khám phá phong cách mới cùng công nghệ thử đồ ảo.",
      imageUrl: "",
      isActive: true,
    },
    {
      bannerId: "banner3",
      title: "Miễn phí vận chuyển",
      content: "Áp dụng cho đơn hàng từ 499K.",
      imageUrl: "",
      isActive: true,
    },
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

// --- MIDDLEWARE XÁC THỰC JWT ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("❌ No token provided");
    return res.status(401).json({ message: "Không có token xác thực" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("❌ Invalid token:", err.message);
      return res.status(403).json({ message: "Token không hợp lệ" });
    }
    console.log("✅ Token verified for user:", user.email);
    req.user = user;
    next();
  });
};

// --- API SẢN PHẨM ---
app.get("/api/products", async (req, res) => {
  try {
    await normalizeProductNumericIds();
    const products = await ProductModel.find().sort({ id: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    // Tìm ID lớn nhất hiện có
    const maxProduct = await ProductModel.findOne().sort({ id: -1 }).limit(1);
    const nextId = maxProduct && maxProduct.id ? maxProduct.id + 1 : 1;

    console.log("🆕 Tạo sản phẩm mới với ID:", nextId);

    const newProduct = new ProductModel({
      ...req.body,
      id: nextId, // Gán ID numeric tự động tăng
    });
    await newProduct.save();

    console.log("✅ Đã lưu với ID:", newProduct.id);
    res.json(newProduct);
  } catch (err) {
    console.error("❌ Lỗi POST:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await ProductModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/products/normalize-ids", async (req, res) => {
  try {
    const result = await normalizeProductNumericIds();
    res.json({ status: "success", ...result });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// --- API NEWSLETTER ---
// 1. Đăng ký nhận tin và nhận mã giảm giá
app.post("/api/newsletter/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }

    // Kiểm tra email đã đăng ký chưa
    const existingSubscriber = await NewsletterModel.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({
        message: "Email này đã đăng ký nhận tin rồi!",
        alreadySubscribed: true,
      });
    }

    // Tạo mã giảm giá unique cho email này
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const couponCode = `NEWS10${randomStr}`;

    // Lưu vào database
    const newSubscriber = new NewsletterModel({
      email,
      couponCode,
      isUsed: false,
    });
    await newSubscriber.save();

    res.json({
      message: "Đăng ký thành công!",
      couponCode,
      discount: 10,
    });
  } catch (err) {
    console.error("Lỗi đăng ký newsletter:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Kiểm tra và sử dụng mã giảm giá từ newsletter
app.post("/api/newsletter/validate-coupon", async (req, res) => {
  try {
    const { couponCode, email } = req.body;

    if (!couponCode) {
      return res.status(400).json({ message: "Mã giảm giá là bắt buộc" });
    }

    // Tìm mã giảm giá
    const subscriber = await NewsletterModel.findOne({ couponCode });

    if (!subscriber) {
      return res.status(404).json({
        message: "Mã giảm giá không hợp lệ",
        valid: false,
      });
    }

    if (subscriber.isUsed) {
      return res.status(400).json({
        message: "Mã giảm giá này đã được sử dụng",
        valid: false,
      });
    }

    res.json({
      message: "Mã giảm giá hợp lệ",
      valid: true,
      discount: 10,
      email: subscriber.email,
    });
  } catch (err) {
    console.error("Lỗi kiểm tra mã:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Đánh dấu mã đã sử dụng
app.post("/api/newsletter/use-coupon", async (req, res) => {
  try {
    const { couponCode } = req.body;

    const subscriber = await NewsletterModel.findOne({ couponCode });
    if (!subscriber) {
      return res.status(404).json({ message: "Mã không tồn tại" });
    }

    if (subscriber.isUsed) {
      return res.status(400).json({ message: "Mã đã được sử dụng" });
    }

    subscriber.isUsed = true;
    await subscriber.save();

    res.json({ message: "Đã đánh dấu mã đã sử dụng" });
  } catch (err) {
    console.error("Lỗi sử dụng mã:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Kiểm tra mã giảm giá đã sử dụng chưa (cho user)
app.post("/api/check-coupon-used", authenticateToken, async (req, res) => {
  try {
    const normalizedCouponCode = String(req.body?.couponCode || "")
      .trim()
      .toUpperCase();

    if (!normalizedCouponCode) {
      return res
        .status(400)
        .json({ message: "Thiếu mã giảm giá", used: false });
    }

    const usedCoupon = await UsedCouponModel.findOne({
      userId: req.user.id,
      couponCode: normalizedCouponCode,
    });

    res.json({
      used: !!usedCoupon,
      message: usedCoupon ? "Mã đã được sử dụng" : "Mã có thể sử dụng",
    });
  } catch (err) {
    console.error("Lỗi kiểm tra mã:", err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Lấy danh sách tất cả mã đã sử dụng của user
app.get("/api/used-coupons", authenticateToken, async (req, res) => {
  try {
    const usedCoupons = await UsedCouponModel.find({
      userId: req.user.id,
    });

    const couponCodes = usedCoupons.map((item) => item.couponCode);

    res.json({
      coupons: couponCodes,
      count: couponCodes.length,
    });
  } catch (err) {
    console.error("Lỗi lấy danh sách mã đã dùng:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- API KIỂM TRA DATABASE ---
app.get("/api/health", async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    const health = {
      status: dbState === 1 ? "OK" : "ERROR",
      database: {
        state: states[dbState],
        name: mongoose.connection.name,
        host: mongoose.connection.host,
      },
      timestamp: new Date().toISOString(),
    };

    // Thử query để chắc chắn database hoạt động
    if (dbState === 1) {
      const productCount = await ProductModel.countDocuments();
      const userCount = await UserModel.countDocuments();
      const orderCount = await OrderModel.countDocuments();
      health.database.collections = {
        products: productCount,
        users: userCount,
        orders: orderCount,
      };
    }

    res.json(health);
  } catch (err) {
    res.status(500).json({
      status: "ERROR",
      message: err.message,
    });
  }
});

// --- API NGƯỜI DÙNG ---
// 1. Đăng ký
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, fullName, phone, address } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email và password là bắt buộc" });
    }

    // Kiểm tra trùng lặp
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Tài khoản đã tồn tại" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tìm ID lớn nhất hiện có
    const maxUser = await UserModel.findOne().sort({ id: -1 }).limit(1);
    const nextId = maxUser && maxUser.id ? maxUser.id + 1 : 1;

    const newUser = new UserModel({
      email,
      password: hashedPassword,
      fullName: fullName || "",
      phone: phone || "",
      address: address || "",
      id: nextId, // Gán ID numeric tự động tăng
    });
    await newUser.save();

    // Tạo JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Đăng ký thành công",
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName,
        phone: newUser.phone,
        address: newUser.address,
        city: newUser.city || "",
        district: newUser.district || "",
        ward: newUser.ward || "",
      },
    });
  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Đăng nhập
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email và password là bắt buộc" });
    }

    // Tìm user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        city: user.city,
        district: user.district,
        ward: user.ward,
      },
    });
  } catch (err) {
    console.error("Lỗi đăng nhập:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Lấy thông tin user hiện tại (cần token)
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    console.log("📝 Request to /api/auth/me with user ID:", req.user.id);
    const user = await UserModel.findById(req.user.id).select("-password");
    if (!user) {
      console.log("❌ User not found in database");
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    console.log("✅ User found:", user.email);
    res.json(user);
  } catch (err) {
    console.error("❌ Error in /api/auth/me:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Cập nhật thông tin user (cần token)
app.put("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const { fullName, phone, address, city, district, ward } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      { fullName, phone, address, city, district, ward },
      { new: true },
    ).select("-password");

    res.json({
      message: "Cập nhật thông tin thành công",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API TẠO ADMIN (Chỉ dùng 1 lần để setup) ---
app.post("/api/auth/create-admin", async (req, res) => {
  try {
    const { email, password, secretKey } = req.body;

    // Bảo vệ endpoint này bằng secret key
    if (secretKey !== "ADMIN_SETUP_2024") {
      return res.status(403).json({ message: "Secret key không đúng" });
    }

    if (!email || !password) {
      return res.status(400).json({ message: "Email và password là bắt buộc" });
    }

    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      // Nếu đã tồn tại, cập nhật thành admin
      existingUser.role = "admin";
      await existingUser.save();
      return res.json({
        message: "Đã cập nhật user thành admin",
        user: {
          id: existingUser._id,
          email: existingUser.email,
          role: existingUser.role,
        },
      });
    }

    // Tạo admin mới
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = new UserModel({
      email,
      password: hashedPassword,
      role: "admin",
      fullName: "Administrator",
    });
    await adminUser.save();

    res.json({
      message: "Tạo tài khoản admin thành công",
      user: {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (err) {
    console.error("Lỗi tạo admin:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- API QUẢN TRỊ USER (chỉ admin) ---
// 1. Lấy danh sách user
app.get("/api/users", async (req, res) => {
  try {
    const users = await UserModel.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("Lỗi lấy users:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Xóa user
app.delete("/api/users/:id", async (req, res) => {
  try {
    await UserModel.findByIdAndDelete(req.params.id);
    res.json({ message: "User Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Sửa quyền (Admin/User)
app.put("/api/users/:id", async (req, res) => {
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    ).select("-password");
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API ĐƠN HÀNG ---
// 1. Tạo đơn hàng mới (cần token)
app.post("/api/orders", authenticateToken, async (req, res) => {
  try {
    console.log("📦 Nhận order request từ user:", req.user.id);
    console.log("📦 Order data:", JSON.stringify(req.body, null, 2));

    const {
      products,
      totalAmount,
      shippingInfo,
      paymentMethod,
      discountCode,
      discountAmount,
      voucherCode,
      voucherDiscount,
      shippingFee,
      shippingMethod,
    } = req.body;

    const normalizedDiscountCode = String(discountCode || "")
      .trim()
      .toUpperCase();

    // Validate dữ liệu
    if (!products || products.length === 0) {
      console.log("❌ Giỏ hàng trống");
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    if (!shippingInfo) {
      console.log("❌ Thiếu thông tin shipping");
      return res.status(400).json({ message: "Thiếu thông tin giao hàng" });
    }

    if (!shippingInfo.fullName) {
      console.log("❌ Thiếu tên");
      return res.status(400).json({ message: "Vui lòng nhập họ tên" });
    }

    if (!shippingInfo.phone) {
      console.log("❌ Thiếu số điện thoại");
      return res.status(400).json({ message: "Vui lòng nhập số điện thoại" });
    }

    if (!shippingInfo.address) {
      console.log("❌ Thiếu địa chỉ");
      return res.status(400).json({ message: "Vui lòng nhập địa chỉ" });
    }

    // Kiểm tra mã giảm giá đã sử dụng
    if (normalizedDiscountCode) {
      const existingUsage = await UsedCouponModel.findOne({
        userId: req.user.id,
        couponCode: normalizedDiscountCode,
      });

      if (existingUsage) {
        console.log("❌ Mã giảm giá đã được sử dụng");
        return res
          .status(400)
          .json({ message: "Mã giảm giá này bạn đã sử dụng rồi" });
      }
    }

    console.log("✅ Validation passed, creating order...");

    const newOrder = new OrderModel({
      userId: req.user.id,
      products,
      totalAmount,
      discountCode: normalizedDiscountCode,
      discountAmount: discountAmount || 0,
      voucherCode: voucherCode || "",
      voucherDiscount: voucherDiscount || 0,
      shippingFee: shippingFee || 0,
      shippingMethod: shippingMethod || "Tiêu chuẩn",
      shippingInfo,
      paymentMethod: paymentMethod || "COD",
    });

    await newOrder.save();
    console.log("✅ Đơn hàng đã lưu thành công:", newOrder._id);

    // Lưu mã giảm giá đã sử dụng
    if (normalizedDiscountCode) {
      try {
        await UsedCouponModel.create({
          userId: req.user.id,
          couponCode: normalizedDiscountCode,
          orderId: newOrder._id,
        });
        console.log("✅ Đã lưu mã giảm giá đã sử dụng");
      } catch (couponErr) {
        console.log("⚠️ Lỗi lưu mã giảm giá:", couponErr.message);
      }
    }

    if (normalizedDiscountCode.startsWith("NEWS10")) {
      try {
        await NewsletterModel.updateOne(
          { couponCode: normalizedDiscountCode, isUsed: false },
          { $set: { isUsed: true } },
        );
      } catch (newsletterErr) {
        console.log(
          "⚠️ Lỗi đánh dấu newsletter coupon:",
          newsletterErr.message,
        );
      }
    }

    // Gửi email xác nhận đơn hàng
    try {
      const user = await UserModel.findById(req.user.id);
      console.log("📧 User email:", user?.email);
      if (user && user.email) {
        await sendOrderConfirmationEmail(user.email, newOrder, shippingInfo);
        console.log("✉️ Đã gửi email xác nhận đơn hàng tới:", user.email);
      } else {
        console.log("⚠️ Không tìm thấy email user, user:", user);
      }
    } catch (emailErr) {
      console.error("⚠️ Không gửi được email:", emailErr.message);
      console.error("⚠️ Chi tiết lỗi email:", emailErr);
      // Không block response nếu gửi email lỗi
    }

    res.json({
      message: "Đặt hàng thành công",
      order: newOrder,
    });
  } catch (err) {
    console.error("❌ Lỗi tạo đơn hàng:", err);
    console.error("❌ Stack:", err.stack);
    res.status(500).json({
      message: "Lỗi server khi tạo đơn hàng",
      error: err.message,
      details: err.toString(),
    });
  }
});

// 2. Lấy đơn hàng của user hiện tại (cần token)
app.get("/api/orders/my-orders", authenticateToken, async (req, res) => {
  try {
    const orders = await OrderModel.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Lấy tất cả đơn hàng (admin)
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .populate("userId", "email fullName")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Cập nhật trạng thái đơn hàng (admin) + gửi notification
app.put("/api/orders/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    // Gửi thông báo cho user
    if (updatedOrder && updatedOrder.userId) {
      const statusMessages = {
        "Đang xử lý": "Đơn hàng của bạn đang được xử lý",
        "Đang giao": "Đơn hàng của bạn đã được giao cho đơn vị vận chuyển",
        "Đã giao": "Đơn hàng đã được giao thành công. Cảm ơn bạn!",
        "Đã hủy": "Đơn hàng đã bị hủy",
      };
      await createNotification(
        updatedOrder.userId,
        `Cập nhật đơn hàng`,
        statusMessages[status] || `Trạng thái đơn hàng: ${status}`,
        "order",
        "/profile",
      );
    }
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Xóa đơn hàng
app.delete("/api/orders/:id", async (req, res) => {
  try {
    await OrderModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Đơn hàng đã được xóa" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Hủy đơn hàng (chỉ cho user, chỉ với đơn Đang xử lý)
app.put("/api/orders/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await OrderModel.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Kiểm tra quyền sở hữu
    if (order.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền hủy đơn hàng này" });
    }

    // Chỉ cho phép hủy đơn đang xử lý
    if (order.status !== "Đang xử lý") {
      return res
        .status(400)
        .json({ message: "Chỉ có thể hủy đơn hàng đang xử lý" });
    }

    order.status = "Đã hủy";
    order.cancelledAt = new Date();
    order.cancelReason = reason || "Khách hàng hủy đơn";
    await order.save();

    // KHÔNG hoàn lại coupon khi hủy đơn: mã đã dùng sẽ mất luôn

    res.json({
      message: "Đã hủy đơn hàng thành công",
      order,
    });
  } catch (err) {
    console.error("Lỗi hủy đơn hàng:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- API BANNER CONTENT ---
// 1. Lấy tất cả banner contents
app.get("/api/banner-contents", async (req, res) => {
  try {
    const banners = await BannerContentModel.find();
    res.json(banners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Lấy banner content theo bannerId
app.get("/api/banner-contents/:bannerId", async (req, res) => {
  try {
    const banner = await BannerContentModel.findOne({
      bannerId: req.params.bannerId,
    });
    if (!banner) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy nội dung banner" });
    }
    res.json(banner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Tạo banner content mới
app.post("/api/banner-contents", async (req, res) => {
  try {
    const { bannerId, title, content, imageUrl } = req.body;

    // Kiểm tra bannerId đã tồn tại chưa
    const existing = await BannerContentModel.findOne({ bannerId });
    if (existing) {
      return res.status(400).json({ message: "Banner ID này đã tồn tại" });
    }

    const newBanner = new BannerContentModel({
      bannerId,
      title,
      content,
      imageUrl,
    });
    await newBanner.save();
    res.json(newBanner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Cập nhật banner content
app.put("/api/banner-contents/:bannerId", async (req, res) => {
  try {
    const { title, content, imageUrl, isActive } = req.body;
    const updatedBanner = await BannerContentModel.findOneAndUpdate(
      { bannerId: req.params.bannerId },
      {
        title,
        content,
        imageUrl,
        isActive,
        updatedAt: Date.now(),
      },
      { new: true },
    );

    if (!updatedBanner) {
      return res.status(404).json({ message: "Không tìm thấy banner" });
    }

    res.json(updatedBanner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Xóa banner content
app.delete("/api/banner-contents/:bannerId", async (req, res) => {
  try {
    const deleted = await BannerContentModel.findOneAndDelete({
      bannerId: req.params.bannerId,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy banner" });
    }
    res.json({ message: "Banner đã được xóa" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// API WISHLIST (ĐỒNG BỘ SERVER)
// =============================================
// 1. Lấy wishlist của user
app.get("/api/wishlist", authenticateToken, async (req, res) => {
  try {
    const wishlist = await WishlistModel.findOne({ userId: req.user.id });
    res.json(wishlist ? wishlist.products : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Thêm sản phẩm vào wishlist
app.post("/api/wishlist/add", authenticateToken, async (req, res) => {
  try {
    const { product } = req.body;
    let wishlist = await WishlistModel.findOne({ userId: req.user.id });
    if (!wishlist) {
      wishlist = new WishlistModel({ userId: req.user.id, products: [] });
    }
    const exists = wishlist.products.find(
      (p) => String(p.productId) === String(product.id || product.productId),
    );
    if (exists) {
      return res
        .status(400)
        .json({ message: "Sản phẩm đã có trong danh sách yêu thích" });
    }
    wishlist.products.push({
      productId: product.id || product.productId,
      name: product.name,
      price: product.price,
      img: product.img,
      category: product.category,
    });
    wishlist.updatedAt = new Date();
    await wishlist.save();
    res.json({ message: "Đã thêm vào yêu thích", products: wishlist.products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Xóa sản phẩm khỏi wishlist
app.post("/api/wishlist/remove", authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;
    const wishlist = await WishlistModel.findOne({ userId: req.user.id });
    if (!wishlist) return res.json({ message: "OK", products: [] });
    wishlist.products = wishlist.products.filter(
      (p) => String(p.productId) !== String(productId),
    );
    wishlist.updatedAt = new Date();
    await wishlist.save();
    res.json({ message: "Đã xóa khỏi yêu thích", products: wishlist.products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Đồng bộ wishlist (merge localStorage + server)
app.post("/api/wishlist/sync", authenticateToken, async (req, res) => {
  try {
    const { localProducts } = req.body;
    let wishlist = await WishlistModel.findOne({ userId: req.user.id });
    if (!wishlist) {
      wishlist = new WishlistModel({ userId: req.user.id, products: [] });
    }
    // Merge: thêm sản phẩm từ local chưa có trên server
    if (localProducts && Array.isArray(localProducts)) {
      for (const lp of localProducts) {
        const exists = wishlist.products.find(
          (p) => String(p.productId) === String(lp.id || lp.productId),
        );
        if (!exists) {
          wishlist.products.push({
            productId: lp.id || lp.productId,
            name: lp.name,
            price: lp.price,
            img: lp.img,
            category: lp.category,
          });
        }
      }
    }
    wishlist.updatedAt = new Date();
    await wishlist.save();
    res.json({ message: "Đã đồng bộ", products: wishlist.products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// API ĐÁNH GIÁ SẢN PHẨM (REVIEW)
// =============================================
// 1. Lấy đánh giá theo sản phẩm
app.get("/api/reviews/:productId", async (req, res) => {
  try {
    const reviews = await ReviewModel.find({
      productId: req.params.productId,
    }).sort({ createdAt: -1 });
    const avgRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1)
        : 0;
    res.json({
      reviews,
      avgRating: parseFloat(avgRating),
      totalReviews: reviews.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Thêm đánh giá (cần đăng nhập)
app.post("/api/reviews", authenticateToken, async (req, res) => {
  try {
    const { productId, rating, comment, images } = req.body;
    if (!productId || !rating) {
      return res.status(400).json({ message: "Thiếu thông tin đánh giá" });
    }
    // Kiểm tra đã review chưa
    const existing = await ReviewModel.findOne({
      productId,
      userId: req.user.id,
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Bạn đã đánh giá sản phẩm này rồi" });
    }
    const user = await UserModel.findById(req.user.id);
    const review = new ReviewModel({
      productId,
      userId: req.user.id,
      userName: user ? user.fullName || user.email : "Ẩn danh",
      rating,
      comment: comment || "",
      images: images || [],
    });
    await review.save();
    res.json({ message: "Đánh giá thành công", review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Like đánh giá
app.post("/api/reviews/:id/like", async (req, res) => {
  try {
    const review = await ReviewModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true },
    );
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// API CHAT HỖ TRỢ KHÁCH HÀNG
// =============================================
// Câu trả lời tự động cho chatbot
const FAQ_ANSWERS = {
  "giao hàng":
    "Nội thành: 1-2 ngày. Ngoại thành: 3-5 ngày. Miễn phí ship cho đơn từ 300k.",
  "đổi trả":
    "Đổi trả trong 7 ngày nếu sản phẩm lỗi hoặc không đúng mô tả. Sản phẩm phải còn nguyên tem mác.",
  "thanh toán":
    "Chúng tôi hỗ trợ: COD, chuyển khoản ngân hàng, Momo, ZaloPay, VNPAY, Visa/MasterCard.",
  "đơn hàng":
    "Bạn có thể theo dõi đơn hàng tại mục 'Đơn hàng của tôi' trong trang cá nhân.",
  size: "Bạn có thể sử dụng tính năng 'Thử đồ 3D' để tìm size phù hợp nhất với cơ thể.",
  "giảm giá":
    "Đăng ký nhận tin để nhận mã giảm giá 10%. Theo dõi Flash Sale hàng ngày để săn ưu đãi!",
  "tài khoản":
    "Bạn có thể đăng ký/đăng nhập bằng email. Tất cả thông tin được bảo mật tuyệt đối.",
  "liên hệ":
    "Hotline: 1900-xxxx | Email: support@vfitai.com | Chat trực tiếp tại đây 24/7.",
  "3d": "Tính năng thử đồ 3D cho phép bạn nhập chiều cao, cân nặng để tạo avatar và thử quần áo ảo.",
  "khuyến mãi":
    "Flash Sale mỗi ngày từ 12h-14h. Giảm đến 50% nhiều sản phẩm hot!",
};

function getBotReply(message) {
  const lower = message.toLowerCase();
  for (const [keyword, answer] of Object.entries(FAQ_ANSWERS)) {
    if (lower.includes(keyword)) return answer;
  }
  return "Cảm ơn bạn đã liên hệ! Nhân viên tư vấn sẽ phản hồi sớm nhất. Bạn có thể hỏi về: giao hàng, đổi trả, thanh toán, size, giảm giá, 3D...";
}

// 1. Gửi tin nhắn chat
app.post("/api/chat/send", async (req, res) => {
  try {
    const { message, userId: clientUserId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Ủu tiên userId từ token (nếu có), sau đó mới dùng client-sent
    let validUserId = null;
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
        if (decoded?.id) {
          validUserId = decoded.id;
          console.log(`💬 Chat from user: ${decoded.email} (${validUserId})`);
        }
      } catch (e) {
        console.log("💬 Chat token invalid:", e.message);
      }
    }
    if (
      !validUserId &&
      clientUserId &&
      /^[0-9a-fA-F]{24}$/.test(String(clientUserId))
    ) {
      validUserId = clientUserId;
      console.log(`💬 Chat from clientUserId: ${validUserId}`);
    }
    if (!validUserId) {
      console.log("💬 Chat from anonymous (no userId)");
    }

    // Lưu tin nhắn user
    const userMsgData = { sender: "user", message: message.trim() };
    if (validUserId) userMsgData.userId = validUserId;
    const userMsg = new ChatMessageModel(userMsgData);
    await userMsg.save();

    // Bot tự động trả lời
    const botReply = getBotReply(message);
    const botMsgData = { sender: "bot", message: botReply };
    if (validUserId) botMsgData.userId = validUserId;
    const botMsg = new ChatMessageModel(botMsgData);
    await botMsg.save();

    res.json({ userMessage: userMsg, botReply: botMsg });
  } catch (err) {
    console.error("Chat send error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Lấy lịch sử chat
app.get("/api/chat/history", authenticateToken, async (req, res) => {
  try {
    const messages = await ChatMessageModel.find({ userId: req.user.id })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// ADMIN CHAT APIs
// =============================================
// 1. Lấy danh sách tất cả cuộc hội thoại (group theo userId)
app.get("/api/admin/chat/conversations", async (req, res) => {
  try {
    // Lấy tất cả userId đã chat (bỏ null)
    const userIds = await ChatMessageModel.distinct("userId", {
      userId: { $ne: null },
    });

    const conversations = await Promise.all(
      userIds.map(async (userId) => {
        const user = await mongoose
          .model("users")
          .findById(userId)
          .select("fullName email")
          .lean();
        const lastMsg = await ChatMessageModel.findOne({ userId })
          .sort({ createdAt: -1 })
          .lean();
        const unread = await ChatMessageModel.countDocuments({
          userId,
          sender: "user",
          isRead: false,
        });
        return {
          userId,
          user: user || { fullName: "Khách ẩn danh", email: "" },
          lastMessage: lastMsg,
          unreadCount: unread,
        };
      }),
    );

    // Sort by last message time descending
    conversations.sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt || 0) -
        new Date(a.lastMessage?.createdAt || 0),
    );

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Lấy toàn bộ tin nhắn của một user (cho admin xem)
app.get("/api/admin/chat/messages/:userId", async (req, res) => {
  try {
    const messages = await ChatMessageModel.find({ userId: req.params.userId })
      .sort({ createdAt: 1 })
      .limit(200);
    // Đánh dấu đã đọc tất cả tin nhắn của user này
    await ChatMessageModel.updateMany(
      { userId: req.params.userId, sender: "user", isRead: false },
      { isRead: true },
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Admin gửi phản hồi cho user
app.post("/api/admin/chat/reply", async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!message || !message.trim())
      return res.status(400).json({ error: "Message required" });
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(String(userId))) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    const msg = new ChatMessageModel({
      userId,
      sender: "admin",
      message: message.trim(),
    });
    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// API THÔNG BÁO (NOTIFICATION)
// =============================================
// 1. Lấy thông báo của user
app.get("/api/notifications", authenticateToken, async (req, res) => {
  try {
    const notifications = await NotificationModel.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await NotificationModel.countDocuments({
      userId: req.user.id,
      isRead: false,
    });
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Đánh dấu đã đọc
app.put("/api/notifications/read", authenticateToken, async (req, res) => {
  try {
    await NotificationModel.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true },
    );
    res.json({ message: "Đã đánh dấu tất cả đã đọc" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Tạo thông báo (hệ thống gọi nội bộ)
async function createNotification(
  userId,
  title,
  message,
  type = "system",
  link = "",
) {
  try {
    const notif = new NotificationModel({ userId, title, message, type, link });
    await notif.save();
    return notif;
  } catch (err) {
    console.error("Lỗi tạo thông báo:", err);
  }
}

// =============================================
// API GỢI Ý SẢN PHẨM THÔNG MINH (RECOMMENDATIONS)
// =============================================
// 1. Ghi nhận lượt xem sản phẩm
app.post("/api/view-history", async (req, res) => {
  try {
    const { userId, productId, category } = req.body;
    if (!productId) return res.status(400).json({ message: "Thiếu productId" });

    if (userId) {
      await ViewHistoryModel.findOneAndUpdate(
        { userId, productId },
        { $inc: { viewCount: 1 }, lastViewedAt: new Date(), category },
        { upsert: true, new: true },
      );
    }
    res.json({ message: "OK" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Lấy sản phẩm gợi ý cho user
app.get("/api/recommendations", async (req, res) => {
  try {
    const { userId, productId, category, limit = 8 } = req.query;
    let recommendedIds = [];

    // Chiến lược 1: Dựa trên lịch sử xem của user
    if (userId) {
      const history = await ViewHistoryModel.find({ userId })
        .sort({ viewCount: -1, lastViewedAt: -1 })
        .limit(20);
      const favCategories = [
        ...new Set(history.map((h) => h.category).filter(Boolean)),
      ];

      if (favCategories.length > 0) {
        const products = await ProductModel.find({
          category: { $in: favCategories },
        }).limit(parseInt(limit));
        recommendedIds = products.map((p) => p);
      }
    }

    // Chiến lược 2: Sản phẩm cùng danh mục
    if (recommendedIds.length < limit && category) {
      const sameCat = await ProductModel.find({
        category,
        id: { $ne: parseInt(productId) },
      }).limit(parseInt(limit) - recommendedIds.length);
      recommendedIds.push(...sameCat);
    }

    // Chiến lược 3: Sản phẩm bán chạy (fallback)
    if (recommendedIds.length < limit) {
      const popular = await ProductModel.find()
        .sort({ sold: -1 })
        .limit(parseInt(limit) - recommendedIds.length);
      recommendedIds.push(...popular);
    }

    // Loại bỏ trùng lặp
    const uniqueProducts = [];
    const seenIds = new Set();
    for (const p of recommendedIds) {
      const pid = String(p.id || p._id);
      if (!seenIds.has(pid)) {
        seenIds.add(pid);
        uniqueProducts.push(p);
      }
    }

    res.json(uniqueProducts.slice(0, parseInt(limit)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// API THANH TOÁN TRỰC TUYẾN (PAYMENT GATEWAY - Mô phỏng)
// =============================================
// 1. Tạo giao dịch thanh toán
app.post("/api/payment/create", authenticateToken, async (req, res) => {
  try {
    const { orderId, amount, method } = req.body;
    // Mô phỏng tạo link thanh toán
    const paymentId =
      "PAY_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const paymentData = {
      paymentId,
      orderId,
      amount,
      method, // momo, zalopay, vnpay, stripe
      status: "pending",
      createdAt: new Date(),
      // Mô phỏng URL thanh toán
      paymentUrl: `https://payment.vfitai.com/pay/${paymentId}`,
      qrCode:
        method === "momo"
          ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=momo://pay?amount=${amount}&id=${paymentId}`
          : null,
    };

    // Mô phỏng: sau 3 giây tự động xác nhận thành công
    setTimeout(async () => {
      try {
        const order = await OrderModel.findById(orderId);
        if (order && order.status === "Đang xử lý") {
          order.paymentMethod = method;
          await order.save();
          // Tạo thông báo
          await createNotification(
            req.user.id,
            "Thanh toán thành công",
            `Đơn hàng #${orderId} đã được thanh toán qua ${method}`,
            "order",
            "/profile",
          );
        }
      } catch (e) {
        console.error("Lỗi xác nhận thanh toán:", e);
      }
    }, 3000);

    res.json(paymentData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Kiểm tra trạng thái thanh toán
app.get("/api/payment/status/:paymentId", async (req, res) => {
  try {
    // Mô phỏng: luôn trả về thành công
    res.json({
      paymentId: req.params.paymentId,
      status: "success",
      message: "Thanh toán thành công",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// ADMIN DATA SYNC & MANAGEMENT APIs
// =============================================

// 1. Kiểm tra trạng thái đồng bộ dữ liệu
app.get("/api/admin/sync-status", async (req, res) => {
  try {
    const orders = await OrderModel.find();
    const users = await UserModel.find();
    const products = new Map();

    // Collect products from orders
    orders.forEach((order) => {
      if (order.products) {
        order.products.forEach((p) => {
          const key = p.productId || p.name;
          if (!products.has(key)) {
            products.set(key, p);
          }
        });
      }
    });

    res.json({
      status: "success",
      data: {
        totalOrders: orders.length,
        totalUsers: users.length,
        totalProducts: products.size,
        lastChecked: new Date(),
        isSynced: orders.length > 0 && users.length > 0,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi check sync status:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Lấy tất cả dữ liệu để đồng bộ
app.get("/api/admin/get-all-data", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    // Verify token (optional - có thể bỏ để test)
    // if (!token) return res.status(401).json({ message: "No token" });

    const orders = await OrderModel.find().lean();
    const users = await UserModel.find().lean();
    const products = new Map();

    // Aggregate products từ orders
    orders.forEach((order) => {
      if (order.products) {
        order.products.forEach((p) => {
          const key = p.productId || p.name;
          if (!products.has(key)) {
            products.set(key, {
              _id: p.productId,
              id: p.productId,
              name: p.name,
              sku: p.sku || `AUTO-${key}`,
              price: p.price,
              img: p.img,
              category: p.category || "Khác",
              quantity: 0,
              totalRevenue: 0,
            });
          }
        });
      }
    });

    // Calculate sales & revenue
    orders.forEach((order) => {
      if (order.products) {
        order.products.forEach((p) => {
          const key = p.productId || p.name;
          const product = products.get(key);
          if (product) {
            product.quantity += p.quantity || 1;
            product.totalRevenue += p.price * (p.quantity || 1);
          }
        });
      }
    });

    res.json({
      status: "success",
      data: {
        orders: orders.length,
        users: users.length,
        products: Array.from(products.values()),
        timestamp: new Date(),
        message: `Đồng bộ ${orders.length} đơn, ${users.length} user, ${products.size} sản phẩm`,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi lấy dữ liệu:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Xóa TẤT CẢ dữ liệu (DANGER - chỉ dùng khi muốn reset hoàn toàn)
app.post("/api/admin/clear-all-data", async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== "CLEAR_ALL_DATA") {
      return res.status(400).json({
        error: "Xác nhận không đúng. Gửi { confirm: 'CLEAR_ALL_DATA' }",
      });
    }

    // Delete all data
    const deletedOrders = await OrderModel.deleteMany({});
    const deletedUsers = await UserModel.deleteMany({});
    const deletedCoupons = await UsedCouponModel.deleteMany({});

    console.log(`
    ⚠️  XÓA DỮ LIỆU HOÀN TOÀN:
    - Orders: ${deletedOrders.deletedCount}
    - Users: ${deletedUsers.deletedCount}
    - Coupons: ${deletedCoupons.deletedCount}
    `);

    res.json({
      status: "success",
      message: "✅ Đã xóa tất cả dữ liệu",
      deleted: {
        orders: deletedOrders.deletedCount,
        users: deletedUsers.deletedCount,
        coupons: deletedCoupons.deletedCount,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi xóa dữ liệu:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Reset dữ liệu về trạng thái ban đầu (tạo test data)
app.post("/api/admin/reset-data", async (req, res) => {
  try {
    // Xóa all data trước
    await OrderModel.deleteMany({});
    await UserModel.deleteMany({});
    await UsedCouponModel.deleteMany({});

    // Tạo user test
    const hashPassword = await bcrypt.hash("123456", 10);
    const testUser = new UserModel({
      email: "test@example.com",
      password: hashPassword,
      fullName: "Test User",
      phone: "0123456789",
      address: "123 Main St",
      city: "Hà Nội",
      district: "Ba Đình",
      ward: "Phường Cống Vị",
      role: "user",
    });
    await testUser.save();

    // Tạo admin
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = new UserModel({
      email: "admin@example.com",
      password: adminPassword,
      fullName: "Admin",
      phone: "0999999999",
      address: "Admin Address",
      city: "Hà Nội",
      district: "Hoàn Kiếm",
      ward: "Phường Hàng Bạc",
      role: "admin",
    });
    await admin.save();

    res.json({
      status: "success",
      message: "✅ Đã reset dữ liệu về ban đầu",
      data: {
        testUser: testUser.email,
        admin: admin.email,
        password: "123456 / admin123",
      },
    });
  } catch (error) {
    console.error("❌ Lỗi reset dữ liệu:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. API endpoint kiểm tra dữ liệu đồng bộ có vấn đề không
app.post("/api/admin/check-sync", async (req, res) => {
  try {
    const orders = await OrderModel.find();
    const users = await UserModel.find();

    // Check if data is synced
    const isSynced = orders.length > 0 && users.length > 0;

    if (!isSynced) {
      return res.json({
        status: "warning",
        isSynced: false,
        message: "❌ Dữ liệu chưa được đồng bộ. Vui lòng clear và reset",
        suggestion:
          "Gọi POST /api/admin/clear-all-data rồi POST /api/admin/reset-data",
      });
    }

    res.json({
      status: "success",
      isSynced: true,
      message: "✅ Dữ liệu đã đồng bộ",
      stats: {
        orders: orders.length,
        users: users.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// THÊM THÔNG BÁO KHI ĐƠN HÀNG THAY ĐỔI TRẠNG THÁI
// Override API cập nhật trạng thái đơn hàng để gửi notification
const originalOrderUpdate = app.put;

app.listen(3000, () => {
  console.log("Server đang chạy tại cloud");
});
