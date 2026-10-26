/* Execute one stateful test plan against the simulated sales app. */
const bcrypt = require("bcryptjs");
const { createEnvironment } = require("./test_environment");
const { emitResult, fail, readInput, redactTokens, send, setupActors, setupError } = require("./harness_common");

async function executePlan(plan, environment) {
  const { app, models } = environment;
  const { users, tokens } = await setupActors(environment);
  const catalog = JSON.parse(JSON.stringify(await models.ProductModel.find({})));
  const variables = Object.fromEntries(Object.entries(users).map(([key, user]) => [key, String(user._id)]));
  const observations = [];
  const inspectEntity = async () => {
    let entity = null;
    if (plan.inspect_entity === "user") entity = await models.UserModel.findById(users.self._id).select("-password");
    if (plan.inspect_entity === "product") entity = await models.ProductModel.findOne({ id: 1 });
    if (plan.inspect_entity === "order" && variables.order) entity = await models.OrderModel.findById(variables.order);
    return entity ? JSON.parse(JSON.stringify(entity)) : null;
  };
  const initialEntity = await inspectEntity();

  const execute = async step => {
    const url = step.url.replace(/\{(\w+)\}/g, (_, key) => {
      if (!(key in variables)) throw new Error(`Unknown URL variable: ${key}`);
      return variables[key];
    });
    if (step.actor && !tokens[step.actor]) throw new Error(`Unknown actor: ${step.actor}`);
    const start = performance.now();
    const response = await send(app, step.method, url, step.body, tokens[step.actor]);
    if (step.save_order) {
      if (![200, 201].includes(response.status) || !response.body.order?._id) {
        throw setupError(`Order setup failed: HTTP ${response.status}`);
      }
      variables.order = String(response.body.order._id);
    }
    return { method: step.method, url, actor: step.actor || null, input: step.body,
      status: response.status, body: response.body, elapsed_ms: performance.now() - start,
      entity_after: await inspectEntity() };
  };

  for (const step of plan.steps) {
    observations.push(await execute(step));
  }

  let passwordAudit = null;
  if (plan.password_audit) {
    const user = await models.UserModel.findOne({ email: "victim@test.com" });
    const isHash = /^\$2[aby]\$/.test(user.password);
    passwordAudit = { is_bcrypt: isHash, verifies: isHash && await bcrypt.compare(plan.password_audit, user.password),
      equals_plaintext: user.password === plan.password_audit };
  }
  let finalEntity = null;
  if (plan.inspect_entity === "user") finalEntity = await models.UserModel.findById(users.self._id).select("-password");
  if (plan.inspect_entity === "product") finalEntity = await models.ProductModel.findOne({ id: 1 });
  if (plan.inspect_entity === "order") finalEntity = await models.OrderModel.findById(variables.order);
  if (plan.check?.kind === "valid_order") {
    const orderId = observations.at(-1)?.body?.order?._id;
    if (orderId) finalEntity = await models.OrderModel.findById(orderId);
  }

  const notifications = plan.inspect_notifications
    ? await models.NotificationModel.find({ userId: users.self._id }) : null;
  redactTokens(observations);
  return { environment: environment.name, limitations: environment.limitations,
    catalog, observations, password_audit: passwordAudit,
    final_products: await models.ProductModel.find({}), notifications,
    initial_entity: initialEntity, final_entity: finalEntity,
    actor_ids: { self: String(users.self._id) } };
}

async function main() {
  const plan = readInput();
  const environment = await createEnvironment(plan.backend || "stub");
  try {
    return await executePlan(plan, environment);
  } finally {
    await environment.close();
  }
}

main().then(result => emitResult({ ok: true, ...result })).catch(fail);
