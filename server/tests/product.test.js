const request = require("supertest");
const app = require("../index");
const { UserModel } = require("../models");

describe("Product API", () => {
  let adminToken;

  beforeAll(async () => {
    // Create an admin user to test admin endpoints
    await request(app).post("/api/auth/register").send({
      email: "admin_prod@test.com", password: "123", fullName: "Admin"
    });
    await UserModel.findOneAndUpdate({ email: "admin_prod@test.com" }, { role: "admin" });
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "admin_prod@test.com", password: "123"
    });
    adminToken = loginRes.body.token;
  });

  it("should create a new product (admin)", async () => {
    const newProduct = {
      id: 101,
      name: "T-Shirt Test",
      price: 200,
      originalPrice: 250,
      category: "Áo",
      status: "active"
    };

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newProduct);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("name", "T-Shirt Test");
  });

  it("should get all products", async () => {
    const res = await request(app).get("/api/products");
    expect(res.statusCode).toEqual(200);
    expect(res.body.products).toBeInstanceOf(Array);
    expect(res.body.products.length).toBeGreaterThanOrEqual(1);
  });

  it("should get a single product by id", async () => {
    const res = await request(app).get("/api/products/101");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("name", "T-Shirt Test");
  });
});
