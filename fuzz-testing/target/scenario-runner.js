/* Execute one stateful test plan against the simulated sales app. */
const bcrypt = require("bcryptjs");
const { createEnvironment } = require("./test-environment");
const { emitResult, fail, readInput, redactTokens, send, setupActors, setupError } = require("./harness-common");
const { resourceForRequest, captureState, entityFromState } = require('./state-snapshot');

async function executePlan(plan, environment) {
  const { app, models } = environment;
  const { users, tokens } = await setupActors(environment);
  const catalog = JSON.parse(JSON.stringify(await models.ProductModel.find({})));
  const variables = Object.fromEntries(Object.entries(users).map(([key, user]) => [key, String(user._id)]));
  const observations = [];
  const execute = async step => {
    const url = step.url.replace(/\{(\w+)\}/g, (_, key) => {
      if (!(key in variables)) throw new Error(`Unknown URL variable: ${key}`);
      return variables[key];
    });
    if (step.actor && !tokens[step.actor]) throw new Error(`Unknown actor: ${step.actor}`);
    let resource = resourceForRequest(step.method, url, step.body);
    const before = await captureState(models, resource);
    const entityBefore = entityFromState(before, resource);
    const start = performance.now();
    const response = await send(app, step.method, url, step.body, tokens[step.actor]);
    const elapsed = performance.now() - start;
    const after = await captureState(models, resource);
    if (step.save_order) {
      if (![200, 201].includes(response.status) || !response.body.order?._id) {
        throw setupError(`Order setup failed: HTTP ${response.status}`);
      }
      variables.order = String(response.body.order._id);
    }
    if (step.method.toUpperCase() === 'POST' && resource) {
      const createdId = resource.collection === 'orders' ? response.body.order?._id
        : resource.collection === 'products' ? response.body.id : response.body.user?.id;
      if (createdId !== undefined) resource = { ...resource, id: createdId };
    }
    return { method: step.method, url, actor: step.actor || null, input: step.body,
      status: response.status, body: response.body, elapsed_ms: elapsed,
      resource, state_before: before, state_after: after,
      entity_before: entityBefore, entity_after: entityFromState(after, resource) };
  };

  for (const step of plan.steps) {
    observations.push(await execute(step));
  }

  let passwordAudit = null;
  if (plan.password_audit) {
    const resource = observations.at(-1)?.resource;
    if (resource?.collection !== 'users' || !resource.id) throw setupError('Password audit requires a targeted user');
    const user = await models.UserModel.findById(resource.id);
    if (!user) throw setupError('Password audit user missing');
    const isHash = /^\$2[aby]\$/.test(user.password);
    passwordAudit = { is_bcrypt: isHash, verifies: isHash && await bcrypt.compare(plan.password_audit, user.password),
      equals_plaintext: user.password === plan.password_audit };
  }
  const initialEntity = observations[0]?.entity_before ?? null;
  const finalEntity = observations.at(-1)?.entity_after ?? null;

  const notifications = plan.inspect_notifications
    ? await models.NotificationModel.find({ userId: users.self._id }) : null;
  redactTokens(observations);
  return { environment: environment.name, limitations: environment.limitations, state_schema_version: 1,
    catalog, observations, password_audit: passwordAudit,
    final_products: await models.ProductModel.find({}), notifications,
    initial_entity: initialEntity, final_entity: finalEntity,
    actor_ids: Object.fromEntries(Object.entries(users).map(([actor, user]) => [actor, String(user._id)])) };
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

if (require.main === module) {
  main().then(result => emitResult({ ok: true, ...result })).catch(fail);
}
module.exports = { executePlan };
