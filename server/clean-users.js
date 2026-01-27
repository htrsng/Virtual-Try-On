// Script để xóa tất cả user ngoại trừ admin
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
      // Lấy tất cả users
      const allUsers = await UserModel.find();
      console.log(`\n📊 Tổng số user hiện tại: ${allUsers.length}`);

      // Hiển thị danh sách
      console.log("\n📋 Danh sách users:");
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - ${user.role}`);
      });

      // Xóa tất cả user không phải admin
      const result = await UserModel.deleteMany({
        role: { $ne: "admin" },
      });

      console.log(
        `\n🗑️  Đã xóa ${result.deletedCount} user(s) không phải admin`,
      );

      // Kiểm tra lại
      const remainingUsers = await UserModel.find();
      console.log(`\n✅ Còn lại ${remainingUsers.length} user(s):`);
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
