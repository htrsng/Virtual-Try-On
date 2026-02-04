async function testAddProduct() {
  try {
    console.log("🧪 Test thêm sản phẩm mới...\n");

    const newProduct = {
      name: "Test Product " + Date.now(),
      price: 100000,
      category: "Áo Thun",
      img: "https://placehold.co/200x200",
      sold: 0,
    };

    const response = await fetch("http://localhost:3000/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    });

    const data = await response.json();

    console.log("✅ Response từ server:");
    console.log('   Field "id":', data.id);
    console.log('   Field "_id":', data._id);
    console.log("   Type of id:", typeof data.id);
    console.log("\n📦 Full response:");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

testAddProduct();
