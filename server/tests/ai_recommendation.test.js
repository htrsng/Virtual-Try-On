const request = require("supertest");
const app = require("../index");

describe("AI & Recommendation API", () => {
  let userToken;

  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({
      email: "ai_user@test.com", password: "123", fullName: "User"
    });
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "ai_user@test.com", password: "123"
    });
    userToken = loginRes.body.token;
  });

  it("should handle AI chat messages and auto reply", async () => {
    const res = await request(app)
      .post("/api/chat/send")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ message: "hỏi về giao hàng", userId: "client_id_fallback" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("userMessage");
    expect(res.body).toHaveProperty("botReply");
    // Bot should mention "giao hàng" based on FAQ keywords
    expect(res.body.botReply.message.toLowerCase()).toContain("giao hàng");
  });

  it("should fetch recommendations", async () => {
    const res = await request(app)
      .get("/api/recommendations?limit=2");
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
  });
});
