const request = require("supertest");
const app = require("../index"); // Cần export app từ index.js

describe("Auth API", () => {
  const testUser = {
    email: "test_auth@example.com",
    password: "password123",
    fullName: "Test Auth User"
  };

  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("message", "Đăng ký thành công");
    expect(res.body.user).toHaveProperty("email", testUser.email);
    expect(res.body.user).not.toHaveProperty("password"); // Password should not be returned
  });

  it("should not register a user with an existing email", async () => {
    // First registration already happened in the previous test?
    // Oh wait, collections are cleared afterEach in setup.js, so we need to register again.
    await request(app)
      .post("/api/auth/register")
      .send(testUser);

    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "Email đã được sử dụng");
  });

  it("should login successfully and return a token", async () => {
    // Register first
    await request(app)
      .post("/api/auth/register")
      .send(testUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("email", testUser.email);
  });

  it("should not login with incorrect password", async () => {
    // Register first
    await request(app)
      .post("/api/auth/register")
      .send(testUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: "wrongpassword"
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "Mật khẩu không đúng");
  it("should get user profile via JWT", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });
      
    const token = loginRes.body.token;
    
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("email", testUser.email);
  });
});
