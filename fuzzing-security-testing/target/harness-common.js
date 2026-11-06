/* Shared request/setup helpers for the simulated runners. */
const fs = require("fs");
const request = require("supertest");

const ACTORS = [
  ["self", "fuzzuser@test.com", "Fuzz123!"],
  ["victim", "victim@test.com", "Victim123!"],
  ["admin", "fuzzadmin@test.com", "Admin123!"],
];

function readInput() {
  if (!process.argv[2]) throw new Error("A JSON input path is required");
  return JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
}

function emitResult(result) {
  process.stdout.write("\n===RESULT===\n" + JSON.stringify(result) + "\n");
}

function fail(error) {
  emitResult({ ok: false, error: String(error.message || error), error_kind: error.kind || "PROCESS_ERROR" });
  process.exitCode = 1;
}

function setupError(message) {
  const error = new Error(message);
  error.kind = "SETUP_ERROR";
  return error;
}

function send(app, method, url, body, token) {
  const verb = method.toLowerCase();
  if (!["get", "post", "put", "delete", "patch"].includes(verb)) throw new Error(`Unsupported method: ${method}`);
  let req = request(app)[verb](url).timeout({ response: 5000, deadline: 7000 });
  if (token) req = req.set("Authorization", `Bearer ${token}`);
  return req.send(body);
}

async function setupActors(environment) {
  const users = {};
  const tokens = {};
  for (const [actor, email, password] of ACTORS) {
    users[actor] = await environment.models.UserModel.findOne({ email });
    const response = await send(environment.app, "POST", "/api/auth/login", { email, password });
    if (!users[actor] || response.status !== 200 || !response.body.token) {
      throw setupError(`Login setup failed for ${actor}: HTTP ${response.status}`);
    }
    tokens[actor] = response.body.token;
  }
  return { users, tokens };
}

function redactTokens(observations) {
  for (const observation of observations) {
    if (observation.body?.token) {
      observation.jwt_claims = JSON.parse(Buffer.from(observation.body.token.split(".")[1], "base64url").toString());
      observation.body.token = "[REDACTED]";
    }
  }
}

module.exports = { emitResult, fail, readInput, redactTokens, send, setupActors, setupError };
