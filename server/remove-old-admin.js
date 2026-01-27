// Script xóa admin@virtualtry.com
const mongoose = require("mongoose");

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

    try {
      // Xóa admin@virtualtry.com
      const result = await UserModel.deleteOne({
        email: "admin@virtualtry.com",
      });

      if (result.deletedCount > 0) {
        console.log("✅ Đã xóa admin@virtualtry.com");
      } else {
        console.log("⚠️  Không tìm thấy admin@virtualtry.com");
      }

      // Kiểm tra lại
      const remainingUsers = await UserModel.find();
      console.log(`\n📊 Còn lại ${remainingUsers.length} user(s):`);
      remainingUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - ${user.role}`);
      });

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
