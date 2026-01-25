const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

// JWT Secret Key
const JWT_SECRET = "your-secret-key-change-this-in-production";

// Kết nối MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/shoppe-db")
  .then(() => console.log("Đã kết nối thành công đến MongoDB!"))
  .catch((err) => console.error("Lỗi kết nối MongoDB:", err));

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
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
      name: String,
      price: Number,
      quantity: Number,
      img: String,
    },
  ],
  totalAmount: { type: Number, required: true },
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
});
const OrderModel = mongoose.model("orders", OrderSchema);

// --- MIDDLEWARE XÁC THỰC JWT ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Không có token xác thực" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token không hợp lệ" });
    }
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
    const user = await UserModel.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.json(user);
  } catch (err) {
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

    const { products, totalAmount, shippingInfo, paymentMethod } = req.body;

    // Validate dữ liệu
    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    if (
      !shippingInfo ||
      !shippingInfo.fullName ||
      !shippingInfo.phone ||
      !shippingInfo.address
    ) {
      return res.status(400).json({ message: "Thiếu thông tin giao hàng" });
    }

    const newOrder = new OrderModel({
      userId: req.user.id,
      products,
      totalAmount,
      shippingInfo,
      paymentMethod,
    });

    await newOrder.save();
    console.log("✅ Đơn hàng đã lưu thành công:", newOrder._id);

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

app.listen(3000, () => {
  console.log("Server đang chạy tại http://localhost:3000");
});
