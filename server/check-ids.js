const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://thanhtb2005:thanhthcsldp1@cluster.awvl3k3.mongodb.net/virtual-try-on')
  .then(async () => {
    const ProductSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.model('products', ProductSchema);
    
    console.log('📋 KIỂM TRA ID CỦA TẤT CẢ SẢN PHẨM:\n');
    
    const products = await Product.find({}).sort({ _id: 1 });
    
    products.forEach((p, index) => {
      const doc = p.toObject();
      console.log(`${index + 1}. ${doc.name}`);
      console.log(`   - Field 'id': ${doc.id}`);
      console.log(`   - Field '_id': ${doc._id}`);
      console.log(`   - Type of id: ${typeof doc.id}`);
      console.log('');
    });
    
    process.exit();
  })
  .catch(err => {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  });
