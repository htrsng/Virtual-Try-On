const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://thanhtb2005:thanhthcsldp1@cluster.awvl3k3.mongodb.net/virtual-try-on",
  )
  .then(async () => {
    const ProductSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.model("products", ProductSchema);

    const productId = "69837e8f88187586ad939364";
    const product = await Product.findById(productId);

    if (product) {
      const doc = product.toObject();
      console.log("📦 Thông tin sản phẩm:");
      console.log("   Tên:", doc.name);
      console.log('   Field "id":', doc.id);
      console.log('   Field "_id":', doc._id);
      console.log("   Type of id:", typeof doc.id);
      console.log("\n🔍 Full document:");
      console.log(JSON.stringify(doc, null, 2));
    } else {
      console.log("❌ Không tìm thấy sản phẩm");
    }

    process.exit();
  })
  .catch((err) => {
    console.error("❌ Lỗi:", err.message);
    process.exit(1);
  });
