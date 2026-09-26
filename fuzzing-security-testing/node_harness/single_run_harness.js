/**
 * Chay DUY NHAT 1 request (single-shot) vao app that qua supertest,
 * dong thoi do COVERAGE CHI TIET (detailed, block-level) bang Inspector
 * Profiler API cua chinh V8 - day la API ma cong cu c8/nyc dung ben
 * duoi, chinh xac hon nhieu so voi bien moi truong NODE_V8_COVERAGE don
 * thuan (chi cho coverage o muc ham, khong du chi tiet).
 *
 * Vai tro tuong duong buoc "goi gcov ngay sau khi chay, doc file .gcov"
 * trong whitebox_fuzzer.py cua Lab8 - chi khac cong cu do (Inspector
 * Profiler + v8-to-istanbul thay vi gcov, vi day la Node/V8 khong phai
 * C/gcc).
 *
 * Cach dung: node single_run_harness.js <duong_dan_file_input.json>
 * In ra STDOUT 1 dong JSON: { ok, status, body, covered_lines: [...] }
 *
 * ================================================================
 * MO RONG (so voi ban dau chi ho tro "login"/"orders"): them 5 target
 * cho 3 module bo sung OrderStatus/UserAdmin/Product. Input JSON gio
 * co them 2 truong tuy chon:
 *   - use_auth  : false => KHONG gan header Authorization du co "token"
 *     hay khong (dung de kiem tra thieu-authorization). Mac dinh true.
 *   - (cac truong target/token/body giu nguyen y nghia cu)
 *
 * LUU Y QUAN TRONG VE COVERAGE khi doc bao cao:
 * Moi lan chay la 1 tien trinh Node MOI -> du lieu trong bo nho
 * (models.js: _orders, _users, _products) RESET VE 0 moi lan. Vi vay:
 *   - "order_status": harness phai tu tao 1 don hang (POST /api/orders)
 *     NGAY TRONG TIEN TRINH NAY roi moi PUT sua trang thai. Ket qua la
 *     covered_lines cua target nay LUON GOM CA cac dong cua buoc tao
 *     don hang, khong chi rieng route PUT - la HANH VI CO CHU DICH.
 *   - "user_update_*": KHONG can tao moi vi models.js da seed san 2
 *     user co dinh (fuzzuser, victim) - chi can GET /api/users de lay
 *     _id (ngau nhien moi tien trinh) roi PUT.
 *   - "product_update": san pham seed san co truong so "id: 1" CO
 *     DINH qua moi tien trinh (khac voi _id la ObjectId ngau nhien) -
 *     nen KHONG can buoc tao truoc, dung thang "/api/products/1".
 *   - "product_create": khong can setup.
 */
const fs = require("fs");
const path = require("path");
const { fileURLToPath } = require("url");
const inspector = require("inspector");
const v8toIstanbul = require("v8-to-istanbul");
const request = require("supertest");

const INDEX_PATH = path.resolve(__dirname, "index.js");

const SETUP_ORDER_BODY = {
  products: [{ productId: 1, name: "Ao thun", price: 200000, quantity: 2 }],
  totalAmount: 400000,
  shippingInfo: { fullName: "Nguyen Van A", phone: "0900000000", address: "123 Duong ABC" },
  paymentMethod: "COD",
};

async function main() {
  const inputPath = process.argv[2];
  const { target, token, use_auth, body } = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  const withAuth = use_auth !== false; // mac dinh true neu khong truyen (giu hanh vi cu)

  const session = new inspector.Session();
  session.connect();
  await post(session, "Profiler.enable");
  await post(session, "Profiler.startPreciseCoverage", { callCount: true, detailed: true });

  // Require app SAU KHI da bat coverage, de ca code o muc module (dang
  // ky route) cung duoc tinh.
  const app = require("./index");

  let result;
  try {
    result = await dispatch(app, target, token, withAuth, body);
  } catch (e) {
    result = { ok: false, error: String((e && e.message) || e) };
  }

  const coverage = await post(session, "Profiler.takePreciseCoverage");
  await post(session, "Profiler.stopPreciseCoverage");
  session.disconnect();

  const targetNormalized = path.normalize(INDEX_PATH).toLowerCase();
  const entry = (coverage.result || []).find((e) => {
    if (!e.url) return false;
    let candidatePath = e.url;
    if (e.url.startsWith("file://")) {
      try {
        candidatePath = fileURLToPath(e.url);
      } catch (err) {
        return false;
      }
    }
    return path.normalize(candidatePath).toLowerCase() === targetNormalized;
  });

  let coveredLines = [];
  if (entry) {
    const converter = v8toIstanbul(INDEX_PATH);
    await converter.load();
    converter.applyCoverage(entry.functions);
    const istanbulData = converter.toIstanbul();
    const fileCov = istanbulData[INDEX_PATH] || Object.values(istanbulData)[0];
    const lineSet = new Set();
    for (const stmtId of Object.keys(fileCov.statementMap)) {
      if (fileCov.s[stmtId] > 0) {
        lineSet.add(fileCov.statementMap[stmtId].start.line);
      }
    }
    coveredLines = Array.from(lineSet).sort((a, b) => a - b);
  }

  process.stdout.write("\n===RESULT===\n" + JSON.stringify({ ...result, covered_lines: coveredLines }) + "\n");
}

async function dispatch(app, target, token, withAuth, body) {
  const auth = (req) => (withAuth && token ? req.set("Authorization", `Bearer ${token}`) : req);

  if (target === "login") {
    const resp = await auth(request(app).post("/api/auth/login")).send(body);
    return { ok: true, status: resp.status, body: resp.body };
  }

  if (target === "orders") {
    const resp = await auth(request(app).post("/api/orders")).send(body);
    return { ok: true, status: resp.status, body: resp.body };
  }

  if (target === "order_status") {
    // Buoc setup (khong tinh la "fuzz input"): can 1 don hang that de
    // co :id hop le. Luon dung token that (khong phu thuoc withAuth)
    // vi day chi la chuan bi du lieu, khong phai doi tuong fuzz.
    const createResp = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send(SETUP_ORDER_BODY);
    if (createResp.status !== 200 && createResp.status !== 201) {
      return { ok: false, error: `SETUP_FAILED_CREATE_ORDER status=${createResp.status}` };
    }
    const orderId = createResp.body && createResp.body.order && createResp.body.order._id;
    const resp = await auth(request(app).put(`/api/orders/${orderId}`)).send(body);
    return { ok: true, status: resp.status, body: resp.body, setup_order_id: orderId };
  }

  if (target === "user_update_self" || target === "user_update_victim") {
    const email = target === "user_update_self" ? "fuzzuser@test.com" : "victim@test.com";
    const listResp = await request(app).get("/api/users");
    const users = Array.isArray(listResp.body) ? listResp.body : [];
    const user = users.find((u) => u.email === email);
    if (!user) {
      return { ok: false, error: `SETUP_FAILED_USER_NOT_FOUND email=${email}` };
    }
    const resp = await auth(request(app).put(`/api/users/${user._id}`)).send(body);
    return { ok: true, status: resp.status, body: resp.body, setup_user_id: user._id };
  }

  if (target === "product_create") {
    const resp = await auth(request(app).post("/api/products")).send(body);
    return { ok: true, status: resp.status, body: resp.body };
  }

  if (target === "product_update") {
    // San pham seed co truong so "id: 1" CO DINH qua moi tien trinh.
    const resp = await auth(request(app).put("/api/products/1")).send(body);
    return { ok: true, status: resp.status, body: resp.body };
  }

  throw new Error(`Unknown target: ${target}`);
}

function post(session, method, params) {
  return new Promise((resolve, reject) => {
    session.post(method, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
}

main().catch((e) => {
  console.error("harness error:", e);
  process.stdout.write("\n===RESULT===\n" + JSON.stringify({ ok: false, error: String(e), covered_lines: [] }) + "\n");
});