const request = require("supertest");
const app = require("../index");
const { UserModel } = require("../models");

describe("Admin API", () => {
  let adminToken;

  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({
      email: "admin_dash@test.com", password: "123", fullName: "Admin"
    });
    await UserModel.findOneAndUpdate({ email: "admin_dash@test.com" }, { role: "admin" });
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "admin_dash@test.com", password: "123"
    });
    adminToken = loginRes.body.token;
  });

  it("should get sync status", async () => {
    // Sync status doesn't seem to require token in some implementations, but let's test it.
    const res = await request(app)
      .get("/api/admin/sync-status")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "success");
    expect(res.body.data).toHaveProperty("totalOrders");
  });

  it("should get all data for sync", async () => {
    const res = await request(app)
      .get("/api/admin/get-all-data")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "success");
    expect(res.body.data).toHaveProperty("users");
  });
});
