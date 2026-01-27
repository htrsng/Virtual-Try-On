// Script để tạo tài khoản admin nhanh
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Schema User
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  fullName: { type: String, default: "" },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  district: { type: String, default: "" },
  ward: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});
const UserModel = mongoose.model("users", UserSchema);

// Kết nối MongoDB
mongoose
  .connect(
    "mongodb+srv://thanhtb2005:thanhthcsldp1@cluster.awvl3k3.mongodb.net/virtual-try-on?retryWrites=true&w=majority",
  )
  .then(async () => {
    console.log("✅ Đã kết nối MongoDB Atlas!");

    // Thông tin admin - THAY ĐỔI TẠI ĐÂY
    const adminEmail = "admin@gmail.com"; // Thay email của bạn
    const adminPassword = "admin123"; // Thay password của bạn

    try {
      // Kiểm tra xem admin đã tồn tại chưa
      const existingAdmin = await UserModel.findOne({ email: adminEmail });

      if (existingAdmin) {
        console.log("👤 User đã tồn tại, cập nhật thành admin...");
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log("✅ Đã cập nhật thành công!");
      } else {
        console.log("👤 Tạo tài khoản admin mới...");
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const adminUser = new UserModel({
          email: adminEmail,
          password: hashedPassword,
          role: "admin",
          fullName: "Administrator",
        });
        await adminUser.save();
        console.log("✅ Tạo admin thành công!");
      }

      console.log("\n📧 Email:", adminEmail);
      console.log("🔑 Password:", adminPassword);
      console.log("👑 Role: admin");
      console.log("\n⚠️  Hãy đổi mật khẩu sau khi đăng nhập!");

      process.exit(0);
    } catch (err) {
      console.error("❌ Lỗi:", err);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối:", err);
    process.exit(1);
  });
