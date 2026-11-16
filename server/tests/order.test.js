const request = require("supertest");
const app = require("../index");

describe("Order API", () => {
  let userToken;

  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({
      email: "user_order@test.com", password: "123", fullName: "User"
    });
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "user_order@test.com", password: "123"
    });
    userToken = loginRes.body.token;
  });

  it("should create a new order and payment", async () => {
    const orderData = {
      products: [
        { productId: 101, name: "Shirt", price: 100, quantity: 2 }
      ],
      totalAmount: 200,
      shippingInfo: {
        fullName: "Test",
        phone: "0123456789",
        address: "123 ABC"
      },
      paymentMethod: "momo"
    };

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send(orderData);

    // Some APIs return 200, some 201. Let's assume 200 or 201 is success.
    expect([200, 201]).toContain(res.statusCode);
    const orderId = res.body.order ? res.body.order._id : res.body._id;
    expect(orderId).toBeDefined();

    // Test payment gateway mock
    const paymentRes = await request(app)
      .post("/api/payment/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        orderId: orderId,
        amount: 200,
        method: "momo"
      });
      
    expect(paymentRes.statusCode).toEqual(200);
    expect(paymentRes.body).toHaveProperty("paymentUrl");
  });

  it("should get user orders", async () => {
    const res = await request(app)
      .get("/api/orders/my-orders")
      .set("Authorization", `Bearer ${userToken}`);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});
