const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://thanhtb2005:thanhthcsldp1@cluster.awvl3k3.mongodb.net/virtual-try-on",
  )
  .then(async () => {
    const ProductSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.model("products", ProductSchema);

    const product = await Product.findOne({});
    console.log("📦 Sản phẩm mẫu:");
    console.log(JSON.stringify(product, null, 2));

    process.exit();
  })
  .catch((err) => {
    console.error("❌ Lỗi:", err.message);
    process.exit(1);
  });
