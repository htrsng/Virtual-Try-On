const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://thanhtb2005:thanhthcsldp1@cluster.awvl3k3.mongodb.net/virtual-try-on",
  )
  .then(async () => {
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model("users", UserSchema);

    console.log("🔄 Đang cập nhật ID cho tất cả users...\n");

    // Lấy tất cả users
    const users = await User.find({}).sort({ _id: 1 });

    console.log(`👤 Tìm thấy ${users.length} users\n`);

    // Update từng user với ID numeric
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const numericId = i + 1;

      await User.findByIdAndUpdate(user._id, {
        $set: { id: numericId },
      });

      console.log(`✅ ${numericId}. ${user.email} → ID: ${numericId}`);
    }

    console.log(
      `\n✨ Hoàn tất! Đã cập nhật ${users.length} users với ID từ 1-${users.length}`,
    );

    // Hiển thị vài users đầu
    console.log("\n📋 Kiểm tra lại:");
    const updated = await User.find({}).sort({ id: 1 }).limit(5);
    updated.forEach((u) => {
      console.log(
        `   ID numeric: ${u.id} | _id MongoDB: ${u._id} | Email: ${u.email}`,
      );
    });

    process.exit();
  })
  .catch((err) => {
    console.error("❌ Lỗi:", err.message);
    process.exit(1);
  });
