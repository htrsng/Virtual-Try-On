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
 */
const fs = require("fs");
const path = require("path");
const { fileURLToPath } = require("url");
const inspector = require("inspector");
const v8toIstanbul = require("v8-to-istanbul");
const request = require("supertest");

const INDEX_PATH = path.resolve(__dirname, "index.js");

async function main() {
  const inputPath = process.argv[2];
  const { target, token, body } = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  const session = new inspector.Session();
  session.connect();
  await post(session, "Profiler.enable");
  await post(session, "Profiler.startPreciseCoverage", { callCount: true, detailed: true });

  // Require app SAU KHI da bat coverage, de ca code o muc module (dang
  // ky route) cung duoc tinh.
  const app = require("./index");

  let result;
  try {
    let req = request(app).post(target === "login" ? "/api/auth/login" : "/api/orders");
    if (token) req = req.set("Authorization", `Bearer ${token}`);
    const resp = await req.send(body);
    result = { ok: true, status: resp.status, body: resp.body };
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

function post(session, method, params) {
  return new Promise((resolve, reject) => {
    session.post(method, params, (err, res) => (err ? reject(err) : resolve(res)));
  });
}

main().catch((e) => {
  console.error("harness error:", e);
  process.stdout.write("\n===RESULT===\n" + JSON.stringify({ ok: false, error: String(e), covered_lines: [] }) + "\n");
});
