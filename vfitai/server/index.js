const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

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

// --- SCHEMA NGƯỜI DÙNG (MỚI) ---
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" }, // 'admin' hoặc 'user'
});
const UserModel = mongoose.model("users", UserSchema);

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
            { new: true }
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

// --- API NGƯỜI DÙNG (MỚI) ---
// 1. Lấy danh sách user
app.get("/api/users", async (req, res) => {
    try {
        const users = await UserModel.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Đăng ký user mới
app.post("/api/users", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        // Kiểm tra trùng lặp
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Tài khoản đã tồn tại" });
        }
        const newUser = new UserModel({ email, password, role });
        await newUser.save();
        res.json(newUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Xóa user
app.delete("/api/users/:id", async (req, res) => {
    try {
        await UserModel.findByIdAndDelete(req.params.id);
        res.json({ message: "User Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Sửa quyền (Admin/User)
app.put("/api/users/:id", async (req, res) => {
    try {
        const updatedUser = await UserModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log("Server đang chạy tại http://localhost:3000");
});
