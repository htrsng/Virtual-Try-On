const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://thanhtb2005:thanhthcsldp1@cluster.awvl3k3.mongodb.net/virtual-try-on')
  .then(async () => {
    const ProductSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.model('products', ProductSchema);
    
    console.log('🔍 Kiểm tra sản phẩm mới nhất từ MongoDB Cloud:\n');
    
    // Lấy sản phẩm mới nhất
    const latestProduct = await Product.findOne().sort({ _id: -1 }).limit(1);
    
    if (latestProduct) {
      const doc = latestProduct.toObject();
      console.log('📦 Sản phẩm mới nhất:');
      console.log('   Tên:', doc.name);
      console.log('   Field "id" từ cloud:', doc.id);
      console.log('   Field "_id" từ cloud:', doc._id);
      console.log('   Type of id:', typeof doc.id);
      
      if (doc.id) {
        console.log('\n✅ ID numeric ĐÃ được lưu vào MongoDB Cloud!');
      } else {
        console.log('\n❌ ID numeric CHƯA được lưu vào MongoDB Cloud!');
      }
    }
    
    process.exit();
  })
  .catch(err => {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  });
