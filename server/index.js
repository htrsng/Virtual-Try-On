const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🟠 MongoDB disconnected");
});

// --- SCHEMA SẢN PHẨM ---
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  img: String,
  category: String,
  sold: Number,
});
const ProductModel = mongoose.model("products", ProductSchema);

// --- SCHEMA NGƯỜI DÙNG ---
const UserSchema = new mongoose.Schema({
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
    const products = await ProductModel.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const newProduct = new ProductModel(req.body);
    await newProduct.save();
    res.json(newProduct);
  } catch (err) {
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
    const { couponCode } = req.body;

    const usedCoupon = await UsedCouponModel.findOne({
      userId: req.user.id,
      couponCode: couponCode,
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

    const newUser = new UserModel({
      email,
      password: hashedPassword,
      fullName: fullName || "",
      phone: phone || "",
      address: address || "",
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
    } = req.body;

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
    if (discountCode) {
      const existingUsage = await UsedCouponModel.findOne({
        userId: req.user.id,
        couponCode: discountCode,
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
      discountCode: discountCode || "",
      discountAmount: discountAmount || 0,
      shippingInfo,
      paymentMethod: paymentMethod || "COD",
    });

    await newOrder.save();
    console.log("✅ Đơn hàng đã lưu thành công:", newOrder._id);

    // Lưu mã giảm giá đã sử dụng
    if (discountCode) {
      try {
        await UsedCouponModel.create({
          userId: req.user.id,
          couponCode: discountCode,
          orderId: newOrder._id,
        });
        console.log("✅ Đã lưu mã giảm giá đã sử dụng");
      } catch (couponErr) {
        console.log("⚠️ Lỗi lưu mã giảm giá:", couponErr.message);
      }
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

// 4. Cập nhật trạng thái đơn hàng (admin)
app.put("/api/orders/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
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

    // Nếu đơn hàng có sử dụng mã giảm giá newsletter, hoàn lại mã
    if (order.discountCode && order.discountCode.startsWith("NEWS10")) {
      const subscriber = await NewsletterModel.findOne({
        couponCode: order.discountCode,
      });
      if (subscriber && subscriber.isUsed) {
        subscriber.isUsed = false;
        await subscriber.save();
      }
    }

    // Xóa record mã giảm giá đã sử dụng
    if (order.discountCode) {
      await UsedCouponModel.findOneAndDelete({
        userId: req.user.id,
        couponCode: order.discountCode,
        orderId: order._id,
      });
    }

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

app.listen(3000, () => {
  console.log("Server đang chạy tại cloud");
});
