const { ProductModel, UserModel, OrderModel } = require("../models");

describe("Database Models", () => {
  it("should normalize product inventory on save", async () => {
    const product = new ProductModel({
      id: 999,
      name: "Test Shirt",
      price: 100,
      variants: [
        {
          color: { name: "Red" },
          sizes: [
            { size: "S", stock: 10 },
            { size: "M", stock: 5 },
          ]
        }
      ]
    });

    await product.save();
    
    // totalStock should be calculated automatically (10 + 5 = 15)
    expect(product.totalStock).toBe(15);
    expect(product.stock).toBe(15);
  });

  it("should require email and password for User", async () => {
    const user = new UserModel({ fullName: "No Email User" });
    let err;
    try {
      await user.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });

  it("should create an order with default status", async () => {
    // Note: requires a valid userId but we are just unit testing the schema defaults if possible,
    // though Mongoose might fail validation if we don't provide userId.
    // Let's create a dummy user first.
    const user = new UserModel({ email: "order@test.com", password: "123" });
    await user.save();

    const order = new OrderModel({
      userId: user._id,
      totalAmount: 500,
    });
    await order.save();
    
    expect(order.status).toBe("Đang xử lý");
    expect(order.paymentMethod).toBe("COD");
  });
});
