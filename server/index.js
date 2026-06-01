const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET, MONGODB_URI, GEMINI_API_KEY } = require("./config/env");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { requireDbReady, authenticateToken, requireAdmin } = require("./middleware");
const {
  ProductModel,
  UserModel,
  OrderModel,
  WishlistModel,
  ReviewModel,
  ChatMessageModel,
  NotificationModel,
  ViewHistoryModel,
  NewsletterModel,
  UsedCouponModel,
  BannerContentModel,
  VirtualClosetModel,
  SavedOutfitModel,
  AILog,
  TryonSessionModel,
  normalizeProductInventory,
} = require("./models");
const {
  sendOrderConfirmationEmail,
  normalizeProductNumericIds,
  seedBannerContents,
  syncOrderItemsToCloset,
  buildLegacyProductVariants,
  normalizeProductForClient,
} = require("./services");
const { createAiRouter } = require("./routes/ai.routes");

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// GEMINI AI CLIENT INITIALIZATION
// ============================================================
let geminiModel = null;
if (GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const modelCandidates = [
      process.env.GEMINI_MODEL,
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.0-flash",
    ].filter(Boolean);

    const generationConfig = {
      response_mime_type: "application/json",
      temperature: 0.7,
      max_output_tokens: 1000,
    };

    geminiModel = genAI.getGenerativeModel({
      model: modelCandidates[0],
      generationConfig,
    });

    // Keep candidates for runtime fallback in case primary model becomes unavailable.
    geminiModel.__fallbackCandidates = modelCandidates;
    geminiModel.__genAI = genAI;
    geminiModel.__generationConfig = generationConfig;

    console.log(`✅ Gemini AI initialized successfully (${modelCandidates[0]})`);
  } catch (err) {
    console.error('❌ Failed to initialize Gemini AI:', err.message);
  }
} else {
  console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
}

const buildProductLookupFilter = (productId) => {
  const trimmedId = String(productId || '').trim();
  const numericId = Number(trimmedId);

  if (mongoose.Types.ObjectId.isValid(trimmedId)) {
    return { _id: trimmedId };
  }

  if (Number.isInteger(numericId)) {
    return { id: numericId };
  }

  return { _id: trimmedId };
};

if (!MONGODB_URI) {
  console.error("❌ Thiếu MONGODB_URI. Hãy đặt giá trị này trong server/.env hoặc biến môi trường hệ thống.");
}

// Kết nối MongoDB với kiểm tra chi tiết
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log("✅ Đã kết nối thành công đến MongoDB Atlas!");
      console.log("📊 Database:", mongoose.connection.name);
      console.log("🔗 Host:", mongoose.connection.host);
      console.log("📡 Connection state:", mongoose.connection.readyState); // 1 = connected
    })
    .catch((err) => {
      console.error("❌ Lỗi kết nối MongoDB Atlas:", err);
      // Keep HTTP server alive so clients get explicit API errors instead of random 404s.
    });
}

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

// ===== ADDRESS MANAGEMENT ENDPOINTS =====

// GET /api/user/addresses - Fetch all saved addresses for the authenticated user
app.get('/api/user/addresses', authenticateToken, requireDbReady, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select('addresses');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ addresses: user.addresses || [] });
  } catch (err) {
    console.error('Error fetching addresses:', err);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// POST /api/user/addresses - Add a new address for the authenticated user
app.post('/api/user/addresses', authenticateToken, requireDbReady, async (req, res) => {
  try {
    const { fullName, phone, province, district, ward, street, isDefault, type } = req.body;

    if (!fullName || !phone || !province || !district || !ward || !street) {
      return res.status(400).json({ error: 'Missing required address fields' });
    }

    const newAddr = {
      _id: new mongoose.Types.ObjectId(),
      fullName,
      phone,
      province,
      district,
      ward,
      street,
      isDefault: !!isDefault,
      type: type || 'home'
    };

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (newAddr.isDefault) {
      user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    user.addresses.push(newAddr);
    await user.save();

    res.json({ success: true, address: newAddr });
  } catch (err) {
    console.error('Error adding address:', err);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

// PUT /api/user/addresses/:addressId - Update an existing address in place
app.put('/api/user/addresses/:addressId', authenticateToken, requireDbReady, async (req, res) => {
  try {
    const { addressId } = req.params;
    const { fullName, phone, province, district, ward, street, isDefault, type } = req.body;

    if (!fullName || !phone || !province || !district || !ward || !street) {
      return res.status(400).json({ error: 'Missing required address fields' });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    address.fullName = fullName;
    address.phone = phone;
    address.province = province;
    address.district = district;
    address.ward = ward;
    address.street = street;
    address.isDefault = !!isDefault;
    address.type = type || 'home';

    if (address.isDefault) {
      user.addresses.forEach((item) => {
        if (String(item._id) !== String(address._id)) {
          item.isDefault = false;
        }
      });
    }

    await user.save();
    res.json({ success: true, address: address.toObject() });
  } catch (err) {
    console.error('Error updating address:', err);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    await normalizeProductNumericIds();
    const products = await ProductModel.find().sort({ id: 1, _id: 1 });
    res.json(products.map(normalizeProductForClient));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products/next-id", authenticateToken, requireDbReady, async (req, res) => {
  try {
    const lastProduct = await ProductModel
      .findOne({ id: { $type: "number" } })
      .sort({ id: -1 })
      .select("id");

    const nextId = (lastProduct?.id ?? 0) + 1;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate ID" });
  }
});

app.get("/api/products/:id/stock", async (req, res) => {
  try {
    const product = await ProductModel.findOne(buildProductLookupFilter(req.params.id));

    if (!product) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }

    const inventory = normalizeProductInventory(product.toObject());
    res.json({
      id: product.id,
      totalStock: inventory.totalStock,
      stock: inventory.stock,
      variants: inventory.variants,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const inventory = normalizeProductInventory(req.body);
    const updatedProduct = await ProductModel.findOneAndUpdate(
      buildProductLookupFilter(req.params.id),
      { $set: { ...req.body, ...inventory } },
      { new: true },
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const deletedProduct = await ProductModel.findOneAndDelete({
      ...buildProductLookupFilter(req.params.id),
    });

    if (!deletedProduct) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }

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

app.post("/api/admin/migrate-products", authenticateToken, requireAdmin, requireDbReady, async (req, res) => {
  try {
    const legacyProducts = await ProductModel.find({
      $or: [
        { variants: { $exists: false } },
        { variants: { $size: 0 } },
      ],
    });

    let migrated = 0;

    for (const product of legacyProducts) {
      const legacyVariants = buildLegacyProductVariants(product.toObject());
      const totalStock = Number(product.totalStock ?? product.stock) || 0;

      await ProductModel.findByIdAndUpdate(product._id, {
        $set: {
          variants: legacyVariants,
          totalStock,
          stock: totalStock,
        },
      });
      migrated += 1;
    }

    res.json({
      success: true,
      message: `Đã migrate ${migrated} sản phẩm`,
      migrated,
    });
  } catch (err) {
    console.error("Migration error:", err);
    res.status(500).json({ error: "Migration failed", detail: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    // Tìm ID lớn nhất hiện có hoặc nhận ID do frontend cấp
    const requestedId = Number(req.body.id);
    const maxProduct = await ProductModel.findOne({ id: { $type: "number" } }).sort({ id: -1 }).limit(1);
    const nextId = Number.isInteger(requestedId) && requestedId > 0
      ? requestedId
      : (maxProduct && maxProduct.id ? maxProduct.id + 1 : 1);
    const inventory = normalizeProductInventory(req.body);

    console.log("🆕 Tạo sản phẩm mới với ID:", nextId);

    const newProduct = new ProductModel({
      ...req.body,
      id: nextId, // Gán ID numeric tự động tăng
      ...inventory,
      ai_attributes: req.body.ai_attributes || {}
    });

    // Mark the field as modified to ensure it gets saved
    newProduct.markModified('ai_attributes');
    newProduct.markModified('variants');

    await newProduct.save();

    console.log("✅ Đã lưu với ID:", newProduct.id);
    res.json(newProduct);
  } catch (err) {
    console.error("❌ Lỗi tạo sản phẩm:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Đăng nhập
app.post("/api/auth/login", async (req, res) => {
  try {
    const emailInput = String(req.body?.email || "").trim();
    const normalizedEmail = emailInput.toLowerCase();
    const password = String(req.body?.password || "");

    if (!emailInput || !password) {
      return res.status(400).json({ message: "Email và password là bắt buộc" });
    }

    // Tìm user
    let user = await UserModel.findOne({ email: normalizedEmail });
    if (!user && emailInput !== normalizedEmail) {
      user = await UserModel.findOne({ email: emailInput });
    }
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản với email này" });
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

// 4. Lấy chi tiết user
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Lấy đơn hàng của user (admin)
app.get("/api/users/:id/orders", async (req, res) => {
  try {
    const orders = await OrderModel.find({ userId: req.params.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Lấy voucher đã dùng của user
app.get("/api/users/:id/used-coupons", async (req, res) => {
  try {
    const usedCoupons = await UsedCouponModel.find({ userId: req.params.id }).sort({ usedAt: -1 });
    res.json(usedCoupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Lấy thống kê của user
app.get("/api/users/:id/stats", async (req, res) => {
  try {
    const userId = req.params.id;
    const orders = await OrderModel.find({ userId });
    
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const usedCouponsCount = await UsedCouponModel.countDocuments({ userId });

    res.json({
      totalOrders,
      totalSpent,
      usedCoupons: usedCouponsCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Lấy danh sách user đã dùng coupon
app.get("/api/coupons/:code/users", async (req, res) => {
  try {
    const usages = await UsedCouponModel.find({ couponCode: req.params.code })
      .populate('userId', 'email fullName role')
      .sort({ usedAt: -1 });
    res.json(usages);
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

      // STEP 1 & 3: Automatically sync items to virtual closet when order is delivered
      const successStatuses = ["Đã giao", "hoàn thành", "delivered", "completed"];
      if (
        successStatuses.some((s) =>
          String(status).toLowerCase().includes(s.toLowerCase())
        )
      ) {
        console.log(
          `🏷️ Order marked as delivered, syncing items to closet...`,
        );
        const syncResult = await syncOrderItemsToCloset(
          updatedOrder.userId,
          updatedOrder._id,
          updatedOrder.products,
        );
        console.log(
          `✅ Closet sync result:`,
          syncResult,
        );
      }
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

// =============================================
// API VIRTUAL CLOSET (TỦ ĐỒ CÁ NHÂN)
// =============================================
// Step 4 & 5: 3D Fitting Room Integration + Mix-and-Match Simulation

// 1. Lấy tủ đồ của user (Step 4: User views closet drawer)
app.get("/api/virtual-closet", authenticateToken, requireDbReady, async (req, res) => {
  try {
    const closet = await VirtualClosetModel.findOne({ userId: req.user.id });

    if (!closet) {
      // Return empty closet if not found
      return res.json({
        userId: req.user.id,
        items: [],
        totalItems: 0,
        categoryCounts: {},
        groupedByCategory: {},
        message: "Closet is empty. Start shopping to build your collection!",
      });
    }

    // Personalized closet: only purchased-success items synced from delivered orders.
    const purchasedItems = closet.items.filter(
      (item) => item.isActive && item.source === "order",
    );
    const normalizedItems = purchasedItems.map((item) => ({
      ...item.toObject(),
      thumbnailUrl: item.thumbnailUrl || item.imageUrl || item.img || "",
      imageUrl: item.imageUrl || item.thumbnailUrl || item.img || "",
      img: item.img || item.imageUrl || item.thumbnailUrl || "",
    }));

    const groupedByCategory = normalizedItems.reduce((acc, item) => {
      const key = String(item.category || "Khác").trim() || "Khác";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    const categoryCounts = Object.entries(groupedByCategory).reduce(
      (acc, [category, items]) => {
        acc[String(category)] = items.length;
        return acc;
      },
      {},
    );

    res.json({
      ...closet.toObject(),
      items: normalizedItems,
      totalItems: normalizedItems.length,
      categoryCounts,
      groupedByCategory,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Lấy tủ đồ theo danh mục
app.get("/api/virtual-closet/category/:category", authenticateToken, requireDbReady, async (req, res) => {
  try {
    const { category } = req.params;
    const closet = await VirtualClosetModel.findOne({ userId: req.user.id });

    if (!closet || !closet.items.length) {
      return res.json({ items: [] });
    }

    const filtered = closet.items.filter(
      (item) =>
        item.isActive &&
        item.source === "order" &&
        item.category.toLowerCase() === category.toLowerCase(),
    );

    const normalized = filtered.map((item) => ({
      ...item.toObject(),
      thumbnailUrl: item.thumbnailUrl || item.imageUrl || item.img || "",
      imageUrl: item.imageUrl || item.thumbnailUrl || item.img || "",
      img: item.img || item.imageUrl || item.thumbnailUrl || "",
    }));

    res.json({ items: normalized, count: normalized.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Wear/Try on item from closet (Step 5: Mix-and-Match Simulation)
app.post("/api/virtual-closet/wear/:itemId", authenticateToken, requireDbReady, async (req, res) => {
  try {
    const { itemId } = req.params;
    const now = new Date();
    const updateResult = await VirtualClosetModel.updateOne(
      { userId: req.user.id, "items.itemId": itemId },
      {
        $inc: {
          "items.$.wearCount": 1,
          "items.$.wornCount": 1,
        },
        $set: {
          "items.$.lastWorn": now,
          "items.$.lastWornAt": now,
          updatedAt: now,
        },
      },
    );

    if (!updateResult.matchedCount) {
      return res.status(404).json({ message: "Closet not found" });
    }

    const closet = await VirtualClosetModel.findOne(
      { userId: req.user.id },
      { items: { $elemMatch: { itemId } } },
    );
    const item = closet?.items?.[0] || null;

    res.json({
      message: "Item selected for try-on",
      item,
      wearCount: item?.wearCount || 0,
      wornCount: item?.wornCount || item?.wearCount || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Remove item from closet
app.delete("/api/virtual-closet/:itemId", authenticateToken, requireDbReady, async (req, res) => {
  try {
    const { itemId } = req.params;
    const closet = await VirtualClosetModel.findOne({ userId: req.user.id });

    if (!closet) {
      return res.status(404).json({ message: "Closet not found" });
    }

    closet.items = closet.items.filter((item) => item.itemId !== itemId);
    closet.totalItems = closet.items.length;
    closet.updatedAt = new Date();
    await closet.save();

    res.json({ message: "Item removed from closet", totalItems: closet.items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get closet stats (for AI Stylist - Step 6)
app.get("/api/virtual-closet/stats/summary", authenticateToken, requireDbReady, async (req, res) => {
  try {
    const closet = await VirtualClosetModel.findOne({ userId: req.user.id });

    if (!closet) {
      return res.json({
        totalItems: 0,
        categories: {},
        mostWorn: null,
        averagePrice: 0,
      });
    }

    // Calculate stats
    const categories = closet.items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const mostWorn = [...closet.items].sort(
      (a, b) => (b.wearCount || 0) - (a.wearCount || 0),
    )[0];

    const avgPrice =
      closet.items.reduce((sum, item) => sum + (item.price || 0), 0) /
      closet.items.length || 0;

    res.json({
      totalItems: closet.items.length,
      categories,
      mostWorn,
      averagePrice: Math.round(avgPrice),
      lastSyncedAt: closet.lastSyncedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Manually add item to closet (for admin or import features)
app.post("/api/virtual-closet/add", authenticateToken, requireDbReady, async (req, res) => {
  try {
    const { productId, name, category, price, img, imageUrl, thumbnailUrl } =
      req.body;

    if (!productId || !name || !category) {
      return res
        .status(400)
        .json({ message: "Missing required fields: productId, name, category" });
    }

    let closet = await VirtualClosetModel.findOne({ userId: req.user.id });
    if (!closet) {
      closet = new VirtualClosetModel({
        userId: req.user.id,
        items: [],
      });
    }

    const itemId = `closet-manual-${Date.now()}-${productId}`;
    const resolvedImage = thumbnailUrl || imageUrl || img || "";
    closet.items.push({
      itemId,
      productId,
      name,
      category,
      price,
      img: resolvedImage,
      imageUrl: imageUrl || resolvedImage,
      thumbnailUrl: thumbnailUrl || resolvedImage,
      dateAdded: new Date(),
      source: "import",
      isActive: true,
    });

    closet.totalItems = closet.items.length;
    closet.updatedAt = new Date();
    await closet.save();

    res.json({
      message: "Item added to closet successfully",
      item: closet.items[closet.items.length - 1],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/saved-outfits", authenticateToken, requireDbReady, async (req, res) => {
  try {
    const { name, slots } = req.body;
    if (!slots || typeof slots !== "object") {
      return res.status(400).json({ success: false, error: "slots is required" });
    }

    const outfit = await SavedOutfitModel.create({
      userId: req.user.id,
      name: String(name || "").trim() || "Outfit chưa đặt tên",
      slots,
    });
    res.status(201).json({ success: true, outfit });
  } catch (err) {
    console.error("[saved-outfits POST]", err);
    res.status(500).json({ success: false, error: "Failed to save outfit" });
  }
});

app.get("/api/saved-outfits", authenticateToken, requireDbReady, async (req, res) => {
  try {
    const outfits = await SavedOutfitModel
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, outfits });
  } catch (err) {
    console.error("[saved-outfits GET]", err);
    res.status(500).json({ success: false, error: "Failed to load saved outfits" });
  }
});

app.delete("/api/saved-outfits/:id", authenticateToken, requireDbReady, async (req, res) => {
  try {
    const result = await SavedOutfitModel.deleteOne({ _id: req.params.id, userId: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: "Outfit not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[saved-outfits DELETE]", err);
    res.status(500).json({ success: false, error: "Failed to delete outfit" });
  }
});

// --- VIRTUAL TRY-ON SESSIONS ---
app.post("/api/tryon/session", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Missing or invalid items" });
    }
    
    // Create new temporary session
    const session = await TryonSessionModel.create({ items });
    
    res.status(201).json({ 
      success: true, 
      session_id: session._id,
      session_url: `/virtual-try-on?session_id=${session._id}` 
    });
  } catch (error) {
    console.error("[tryon-session POST]", error);
    res.status(500).json({ success: false, error: "Failed to create try-on session" });
  }
});

app.get("/api/tryon/session/:id", async (req, res) => {
  try {
    const session = await TryonSessionModel.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found or expired" });
    }
    res.json({ success: true, session });
  } catch (error) {
    console.error("[tryon-session GET]", error);
    res.status(500).json({ success: false, error: "Failed to get try-on session" });
  }
});

// --- ADMIN STATS ---
app.get("/api/admin/ai-stats", authenticateToken, requireAdmin, requireDbReady, async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalRequests, last7Days, recentPrompts] = await Promise.all([
      AILog.countDocuments(),
      AILog.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      AILog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("userPrompt createdAt outfitCount missingCount")
        .lean(),
    ]);

    res.json({
      success: true,
      totalRequests,
      last7Days,
      recentPrompts,
    });
  } catch (err) {
    console.error("[admin ai stats]", err);
    res.status(500).json({ success: false, error: "Failed to fetch AI stats" });
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

// 0. Kiểm tra xem user có thể đánh giá sản phẩm không
app.get("/api/products/:productId/can-review", authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Kiểm tra xem đã đánh giá chưa
    const existingReview = await ReviewModel.findOne({
      productId,
      userId,
    });

    if (existingReview) {
      return res.json({
        canReview: false,
        hasPurchased: true,
        hasReviewed: true,
        message: "Bạn đã đánh giá sản phẩm này rồi",
      });
    }

    // Tìm order của user cho product này
    const order = await OrderModel.findOne({
      userId,
      "items.productId": productId,
      $or: [
        { status: "completed" },
        { status: "delivered" },
        { status: "Hoàn thành" },
        { status: "Đã giao" },
      ],
    });

    if (order) {
      return res.json({
        canReview: true,
        hasPurchased: true,
        hasReviewed: false,
        message: "Bạn có thể đánh giá sản phẩm này",
      });
    }

    // Kiểm tra xem user đã mua nhưng chưa giao
    const pendingOrder = await OrderModel.findOne({
      userId,
      "items.productId": productId,
    });

    if (pendingOrder) {
      return res.json({
        canReview: false,
        hasPurchased: true,
        hasReviewed: false,
        status: pendingOrder.status,
        message: "Vui lòng chờ đơn hàng được giao trước khi đánh giá",
      });
    }

    // Chưa mua
    return res.json({
      canReview: false,
      hasPurchased: false,
      hasReviewed: false,
      message: "Bạn cần mua sản phẩm này trước khi đánh giá",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// 2. Thêm đánh giá (chỉ cần đăng nhập)
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

// ============================================================
// AI OUTFIT GENERATOR ROUTES
// ============================================================
app.use(
  "/api/ai",
  createAiRouter({
    authenticateToken,
    requireDbReady,
    geminiModel,
    ProductModel,
    mongoose,
  }),
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
