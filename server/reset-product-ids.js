const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://thanhtb2005:thanhthcsldp1@cluster.awvl3k3.mongodb.net/virtual-try-on",
  )
  .then(async () => {
    const ProductSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.model("products", ProductSchema);

    console.log("🔄 Đang cập nhật ID cho tất cả sản phẩm...\n");

    // Lấy tất cả sản phẩm
    const products = await Product.find({}).sort({ _id: 1 });

    console.log(`📦 Tìm thấy ${products.length} sản phẩm\n`);

    // Update từng sản phẩm với ID numeric
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const numericId = i + 1;

      await Product.findByIdAndUpdate(product._id, {
        $set: { id: numericId },
      });

      console.log(`✅ ${numericId}. ${product.name} → ID: ${numericId}`);
    }

    console.log(
      `\n✨ Hoàn tất! Đã cập nhật ${products.length} sản phẩm với ID từ 1-${products.length}`,
    );

    // Hiển thị vài sản phẩm đầu
    console.log("\n📋 Kiểm tra lại:");
    const updated = await Product.find({}).sort({ id: 1 }).limit(5);
    updated.forEach((p) => {
      console.log(
        `   ID numeric: ${p.id} | _id MongoDB: ${p._id} | Tên: ${p.name}`,
      );
    });

    process.exit();
  })
  .catch((err) => {
    console.error("❌ Lỗi:", err.message);
    process.exit(1);
  });
