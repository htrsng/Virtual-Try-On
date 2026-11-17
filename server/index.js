const { versionedUpdate } = require("./concurrency");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET, MONGODB_URI, GEMINI_API_KEY } = require("./config/env");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { requireDbReady, authenticateToken, optionalAuthenticate, requireAdmin } = require("./middleware");
const { validateRequest, sendError, safeUser, fields, ensure, email: validEmail, password: validPassword, text, objectId } = require('./validation');
const { createOrder, changeOrderStatus } = require('./checkout');
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
app.use(express.json({ limit: '100kb' }));
const health = require('./health');
app.get('/api/health/live', health.live);
app.get('/api/health/ready', health.ready);
// Retired operational endpoints are deliberately absent in every environment.
app.use(['/api/auth/create-admin', '/api/admin/reset-data', '/api/admin/clear-all-data'], (req, res) =>
  res.status(404).json({ code: 'NOT_FOUND', error: 'Endpoint retired' }));
app.use('/api/admin', authenticateToken, requireAdmin);
app.use('/api/users', authenticateToken, requireAdmin);
app.use('/api/coupons', authenticateToken, requireAdmin);
// Authenticate management requests before validation so callers cannot probe admin input contracts anonymously.
app.use((req, res, next) => {
  const url = req.path.toLowerCase().replace(/\/+$/, '') || '/';
  const write = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const management = (/^\/api\/(products|banner-contents)(?:\/|$)/.test(url) && write)
    || url === '/api/products/next-id'
    || (url === '/api/orders' && req.method === 'GET')
    || (/^\/api\/orders\/[^/]+$/.test(url) && ['PUT', 'DELETE'].includes(req.method));
  if (!management) return next();
  authenticateToken(req, res, () => requireAdmin(req, res, next));
});
app.use('/api', requireDbReady);
app.use(validateRequest);

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

if (!MONGODB_URI && process.env.NODE_ENV !== 'test') {
  console.error("❌ Thiếu MONGODB_URI. Hãy đặt giá trị này trong server/.env hoặc biến môi trường hệ thống.");
}

// Kết nối MongoDB với kiểm tra chi tiết
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log("✅ Đã kết nối MongoDB");
      console.log("📊 Database:", mongoose.connection.name);
      console.log("🔗 Host:", mongoose.connection.host);
      console.log("📡 Connection state:", mongoose.connection.readyState); // 1 = connected
    })
    .catch((err) => {
      console.error("❌ Lỗi kết nối MongoDB:", err);
      // Keep HTTP server alive so clients get explicit API errors instead of random 404s.
    });
}

// Theo dõi trạng thái database
mongoose.connection.on("connected", () => {
  if (process.env.NODE_ENV === 'test') return;
  console.log("🟢 MongoDB connected");
  seedBannerContents().catch((err) =>
    console.error("❌ Seed banner contents error:", err),
  );
  // Product identity maintenance is explicit via the protected admin endpoint.
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🟠 MongoDB disconnected");
});

// Global validation above deliberately precedes the address router.
app.use('/api/user/addresses', require('./routes/addresses.routes'));

app.get("/api/products", async (req, res) => {
  try {
    const products = await ProductModel.find().sort({ id: 1, _id: 1 });
    res.json(products.map(normalizeProductForClient));
  } catch (err) {
    sendError(res, err);
  }
});

app.get("/api/products/next-id", authenticateToken, requireAdmin, requireDbReady, async (req, res) => {
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
    sendError(res, err);
  }
});

app.put("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const current = await ProductModel.findOne(buildProductLookupFilter(req.params.id));
    if (!current) return res.status(404).json({ error: 'Product not found' });
    ensure(req.body.id === undefined || req.body.id === current.id, 'Product numeric identity cannot be changed');
    const source = { ...current.toObject(), ...req.body };
    if (req.body.stock !== undefined && req.body.totalStock === undefined) source.totalStock = req.body.stock;
    const inventory = normalizeProductInventory(source);
    const updatedProduct = await versionedUpdate(ProductModel,
      buildProductLookupFilter(req.params.id), req.body, inventory);

    if (!updatedProduct) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }

    res.json(updatedProduct);
  } catch (err) {
    sendError(res, err);
  }
});

app.delete("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const product = await ProductModel.findOne(buildProductLookupFilter(req.params.id));
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (await OrderModel.exists({ inventoryReserved: true, status: { $in: ['Đang xử lý', 'Đang giao'] },
      'products.productId': { $in: [product.id, String(product._id)] } })) return res.status(409).json({ error: 'Product has reserved orders' });
    const deletedProduct = await ProductModel.findOneAndDelete({ _id: product._id, __v: product.__v });
    if (!deletedProduct) return res.status(409).json({ error: 'Product changed; reload before deleting' });

    res.json({ message: "Deleted" });
  } catch (err) {
    sendError(res, err);
  }
});

app.post("/api/admin/products/normalize-ids", async (req, res) => {
  try {
    const result = await normalizeProductNumericIds();
    res.json({ status: "success", ...result });
  } catch (err) {
    sendError(res, err);
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
    sendError(res, err);
  }
});

app.post("/api/products", authenticateToken, requireAdmin, async (req, res) => {
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
    res.status(201).json(newProduct);
  } catch (err) {
    console.error("❌ Lỗi tạo sản phẩm:", err);
    sendError(res, err);
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await ProductModel.findOne(buildProductLookupFilter(req.params.id));
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(normalizeProductForClient(product));
  } catch (error) { sendError(res, error); }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    fields(req.body, ['email', 'password', 'fullName', 'phone', 'address']);
    ensure(validEmail(req.body.email) && validPassword(req.body.password), 'Valid email and password (8+ characters, at most 72 bytes) required');
    for (const key of ['fullName', 'phone', 'address']) if (req.body[key] !== undefined) ensure(typeof req.body[key] === 'string' && req.body[key].length <= 500, `Invalid ${key}`);
    const user = await UserModel.create({ ...req.body, email: req.body.email.trim().toLowerCase(),
      password: await bcrypt.hash(req.body.password, 12), role: 'user' });
    const token = jwt.sign({ id: String(user._id), email: user.email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Đăng ký thành công', token, user: safeUser(user) });
  } catch (error) { sendError(res, error); }
});

// 2. Đăng nhập
app.post("/api/auth/login", async (req, res) => {
  try {
    fields(req.body, ['email', 'password']);
    ensure(validEmail(req.body.email) && typeof req.body.password === 'string' && req.body.password.length > 0 && Buffer.byteLength(req.body.password) <= 72, 'Valid email and password required');
    const emailInput = req.body.email.trim();
    const normalizedEmail = emailInput.toLowerCase();
    const password = String(req.body?.password || "");

    if (!emailInput || !password) {
      return res.status(400).json({ message: "Email và password là bắt buộc" });
    }

    // Tìm user
    let user = await UserModel.findOne({ email: normalizedEmail }).select("+password");
    if (!user && emailInput !== normalizedEmail) {
      user = await UserModel.findOne({ email: emailInput }).select("+password");
    }
    if (!user) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await UserModel.findOneAndUpdate({ _id: user._id }, { $inc: { failedLoginCount: 1 } });
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
    sendError(res, err);
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
    res.json(safeUser(user));
  } catch (err) {
    console.error("❌ Error in /api/auth/me:", err);
    sendError(res, err);
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
      user: safeUser(updatedUser),
    });
  } catch (err) {
    sendError(res, err);
  }
});

// Admin bootstrap moved to scripts/create-admin.js (no public HTTP bootstrap).

// --- API QUẢN TRỊ USER (chỉ admin) ---
// 1. Lấy danh sách user
app.get("/api/users", async (req, res) => {
  try {
    const users = await UserModel.find().select("-password");
    res.json(users.map(safeUser));
  } catch (err) {
    console.error("Lỗi lấy users:", err);
    sendError(res, err);
  }
});

// 2. Xóa user
app.delete("/api/users/:id", async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(409).json({ error: 'Cannot delete your current admin account' });
    const deleted = await UserModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: "User Deleted" });
  } catch (err) {
    sendError(res, err);
  }
});

// 3. Sửa quyền (Admin/User)
app.put("/api/users/:id", async (req, res) => {
  try {
    if (req.params.id === req.user.id && req.body.role && req.body.role !== 'admin') return res.status(409).json({ error: 'Cannot demote your current admin account' });
    const updatedUser = await versionedUpdate(UserModel, { _id: req.params.id }, req.body);
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json(safeUser(updatedUser));
  } catch (err) {
    sendError(res, err);
  }
});

// 4. Lấy chi tiết user
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(safeUser(user));
  } catch (err) {
    sendError(res, err);
  }
});

// 5. Lấy đơn hàng của user (admin)
app.get("/api/users/:id/orders", async (req, res) => {
  try {
    const orders = await OrderModel.find({ userId: req.params.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    sendError(res, err);
  }
});

// 6. Lấy voucher đã dùng của user
app.get("/api/users/:id/used-coupons", async (req, res) => {
  try {
    const usedCoupons = await UsedCouponModel.find({ userId: req.params.id }).sort({ usedAt: -1 });
    res.json(usedCoupons);
  } catch (err) {
    sendError(res, err);
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
    sendError(res, err);
  }
});

// 8. Lấy danh sách user đã dùng coupon
app.get('/api/used-coupons', authenticateToken, async (req, res) => {
  try {
    const usages = await UsedCouponModel.find({ userId: req.user.id }).select('couponCode').lean();
    res.json({ coupons: usages.map(usage => usage.couponCode) });
  } catch (error) { sendError(res, error); }
});

app.get("/api/coupons/:code/users", async (req, res) => {
  try {
    const usages = await UsedCouponModel.find({ couponCode: req.params.code })
      .populate('userId', 'email fullName role')
      .sort({ usedAt: -1 });
    res.json(usages);
  } catch (err) {
    sendError(res, err);
  }
});

// --- API ĐƠN HÀNG ---
// 1. Tạo đơn hàng mới (cần token)
app.post("/api/orders", authenticateToken, async (req, res) => {
  try {
    const order = await createOrder(req.user.id, req.body);
    // Email is an optional side effect, never a source of totals or order state.
    if (process.env.NODE_ENV !== 'test' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      sendOrderConfirmationEmail(req.user.email, order, order.shippingInfo).catch(() => console.error('Order email delivery failed'));
    }
    res.status(201).json({ message: 'Đặt hàng thành công', order });
  } catch (error) { sendError(res, error); }
});

// 2. Lấy đơn hàng của user hiện tại (cần token)
app.get("/api/orders/my-orders", authenticateToken, async (req, res) => {
  try {
    const orders = await OrderModel.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    sendError(res, err);
  }
});

// 3. Lấy tất cả đơn hàng (admin)
app.get("/api/orders", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .populate("userId", "email fullName")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    sendError(res, err);
  }
});

// 4. Cập nhật trạng thái đơn hàng (admin) + gửi notification
app.put("/api/orders/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    fields(req.body, ['status', '__v']);
    const { status } = req.body;
    const updatedOrder = await changeOrderStatus(req.params.id, status, req.body.__v);
    if (!updatedOrder) return res.status(404).json({ error: "Order not found" });

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
    sendError(res, err);
  }
});

// 5. Xóa đơn hàng
app.delete("/api/orders/:id", authenticateToken, requireAdmin, (req, res) => {
  res.status(405).json({ error: 'Order audit records cannot be deleted; use status transitions', code: 'METHOD_NOT_ALLOWED' });
});

// 6. Hủy đơn hàng (chỉ cho user, chỉ với đơn Đang xử lý)
app.put("/api/orders/:id/cancel", authenticateToken, async (req, res) => {
  try {
    fields(req.body, ['reason']);
    if (req.body.reason !== undefined) ensure(text(req.body.reason, 500), 'Invalid cancellation reason');
    const order = await changeOrderStatus(req.params.id, 'Đã hủy', undefined, req.user.id, req.body.reason);
    res.json({ message: 'Đã hủy đơn hàng thành công', order });
  } catch (error) { sendError(res, error); }
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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
  }
});

// 3. Tạo banner content mới
app.post("/api/banner-contents", authenticateToken, requireAdmin, async (req, res) => {
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
    sendError(res, err);
  }
});

// 4. Cập nhật banner content
app.put("/api/banner-contents/:bannerId", authenticateToken, requireAdmin, async (req, res) => {
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
    sendError(res, err);
  }
});

// 5. Xóa banner content
app.delete("/api/banner-contents/:bannerId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await BannerContentModel.findOneAndDelete({
      bannerId: req.params.bannerId,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy banner" });
    }
    res.json({ message: "Banner đã được xóa" });
  } catch (err) {
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
  }
});

// 1. Lấy đánh giá theo sản phẩm
app.get("/api/reviews/:productId", async (req, res) => {
  try {
    const id = req.params.productId;
    const reviews = await ReviewModel.find({
      productId: { $in: /^\d+$/.test(id) ? [id, Number(id)] : [id] },
    }).select('-userId -__v').sort({ createdAt: -1 });
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
    sendError(res, err);
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
      userName: user?.fullName || "Ẩn danh",
      rating,
      comment: comment || "",
      images: images || [],
    });
    await review.save();
    res.json({ message: "Đánh giá thành công", review });
  } catch (err) {
    sendError(res, err);
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
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json({ _id: review._id, likes: review.likes });
  } catch (err) {
    sendError(res, err);
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
app.post("/api/chat/send", optionalAuthenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const validUserId = req.user?.id;

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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
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
    sendError(res, err);
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
app.post("/api/view-history", authenticateToken, async (req, res) => {
  try {
    const { productId, category } = req.body;
    const userId = req.user.id;
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
    sendError(res, err);
  }
});

// 2. Lấy sản phẩm gợi ý cho user
app.get("/api/recommendations", optionalAuthenticate, async (req, res) => {
  try {
    const { productId, category, limit = 8 } = req.query;
    const userId = req.user?.id;
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
    sendError(res, err);
  }
});

// =============================================
// API THANH TOÁN TRỰC TUYẾN (PAYMENT GATEWAY - Mô phỏng)
// =============================================
// 1. Tạo giao dịch thanh toán
app.post('/api/payment/create', authenticateToken, async (req, res) => {
  try {
    fields(req.body, ['orderId', 'amount', 'method']);
    ensure(objectId(req.body.orderId), 'Invalid orderId');
    const order = await OrderModel.findOne({ _id: req.body.orderId, userId: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // Fake payment links and delayed automatic success have been removed.
    res.status(503).json({ code: 'PAYMENT_UNAVAILABLE', error: 'Online payment provider is not configured' });
  } catch (error) { sendError(res, error); }
});
app.get('/api/payment/status/:paymentId', authenticateToken, (req, res) => {
  res.status(404).json({ code: 'PAYMENT_NOT_FOUND', error: 'Payment not found' });
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
    sendError(res, error);
  }
});

// 2. Lấy tất cả dữ liệu để đồng bộ
app.get("/api/admin/get-all-data", async (req, res) => {
  try {
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
    sendError(res, error);
  }
});

// Destructive reset/clear handlers removed. Test fixture cleanup belongs to the disposable DB runner.

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
        message: "Chưa có đủ dữ liệu để thống kê đồng bộ",
        suggestion: "Kiểm tra nguồn dữ liệu và cấu hình kết nối; dữ liệu hiện có được giữ nguyên",
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
    sendError(res, error);
  }
});

// THÊM THÔNG BÁO KHI ĐƠN HÀNG THAY ĐỔI TRẠNG THÁI
// Override API cập nhật trạng thái đơn hàng để gửi notification
// Order transitions are handled by checkout.js.

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

app.use((req, res) => res.status(404).json({ code: 'NOT_FOUND', error: 'Route not found' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ code: 'INVALID_JSON', error: 'Invalid JSON body' });
  if (error.type === 'entity.too.large') return res.status(413).json({ code: 'PAYLOAD_TOO_LARGE', error: 'Request body too large' });
  sendError(res, error);
});
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Server đang chạy tại http://${HOST}:${PORT}`);
  });
}

module.exports = app;
