/* One request per process, with line coverage of node_harness/index.js.
 * Coverage includes app initialization and setup, not the whole real application.
 */
const path = require("path");
const { fileURLToPath } = require("url");
const inspector = require("inspector");
const v8toIstanbul = require("v8-to-istanbul");
const { createEnvironment } = require("./test_environment");
const { emitResult, fail, readInput, send, setupError } = require("./harness_common");
const ORDER_SEED = require("../seed_corpus/seed_order_valid.json");

function post(session, method, params) {
  return new Promise((resolve, reject) => {
    session.post(method, params, (error, result) => error ? reject(error) : resolve(result));
  });
}

async function dispatch(environment, input) {
  const { app, models } = environment;
  const { target, token, body } = input;
  const requestToken = input.use_auth === false ? undefined : token;
  let response;
  let extra = {};
  if (target === "login") {
    response = await send(app, "POST", "/api/auth/login", body);
  } else if (target === "orders") {
    extra.catalog = Object.fromEntries((await models.ProductModel.find({})).map(product => [product.id, product.price]));
    response = await send(app, "POST", "/api/orders", body, requestToken);
  } else if (target === "order_status") {
    const setup = await send(app, "POST", "/api/orders", ORDER_SEED, token);
    if (![200, 201].includes(setup.status) || !setup.body.order?._id) {
      throw setupError(`Order setup failed: HTTP ${setup.status}`);
    }
    const order = setup.body.order;
    extra = { setup_order_id: order._id, initial_status: order.status };
    response = await send(app, "PUT", `/api/orders/${order._id}`, body, requestToken);
  } else if (target === "user_update_self" || target === "user_update_victim") {
    const email = target === "user_update_self" ? "fuzzuser@test.com" : "victim@test.com";
    const user = await models.UserModel.findOne({ email });
    if (!user) throw setupError(`Seeded user not found: ${email}`);
    extra.setup_user_id = user._id;
    response = await send(app, "PUT", `/api/users/${user._id}`, body, requestToken);
  } else if (target === "product_create") {
    response = await send(app, "POST", "/api/products", body, requestToken);
  } else if (target === "product_update") {
    response = await send(app, "PUT", "/api/products/1", body, requestToken);
  } else {
    throw new Error(`Unknown fuzz target: ${target}`);
  }
  return { ok: true, status: response.status, body: response.body, ...extra };
}

async function coveredLines(coverage, indexPath) {
  const normalized = path.normalize(indexPath).toLowerCase();
  const entry = (coverage.result || []).find(item => {
    if (!item.url) return false;
    const candidate = item.url.startsWith("file://") ? fileURLToPath(item.url) : item.url;
    return path.normalize(candidate).toLowerCase() === normalized;
  });
  if (!entry) throw new Error("Profiler did not return coverage for the simulated app");
  const converter = v8toIstanbul(indexPath);
  await converter.load();
  converter.applyCoverage(entry.functions);
  const files = converter.toIstanbul();
  const file = files[indexPath] || Object.values(files)[0];
  return [...new Set(Object.entries(file.statementMap)
    .filter(([id]) => file.s[id] > 0)
    .map(([, statement]) => statement.start.line))].sort((a, b) => a - b);
}

async function main() {
  const input = readInput();
  const session = new inspector.Session();
  let environment;
  session.connect();
  try {
    await post(session, "Profiler.enable");
    await post(session, "Profiler.startPreciseCoverage", { callCount: true, detailed: true });
    environment = await createEnvironment();
    const result = await dispatch(environment, input);
    const coverage = await post(session, "Profiler.takePreciseCoverage");
    await post(session, "Profiler.stopPreciseCoverage");
    return { ...result, environment: environment.name, coverage_file: environment.indexPath,
      covered_lines: await coveredLines(coverage, environment.indexPath) };
  } finally {
    session.disconnect();
    if (environment) await environment.close();
  }
}

main().then(emitResult).catch(fail);
