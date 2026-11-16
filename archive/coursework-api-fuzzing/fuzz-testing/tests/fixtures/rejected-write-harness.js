/* Deliberately faulty TEST DOUBLE, never loaded by the application or campaign. */
const express = require('../../target/node_modules/express');
const models = require('../../target/models');
const { executePlan } = require('../../target/scenario-runner');
const { emitResult, fail, readInput } = require('../../target/harness-common');

async function main() {
  const plan = readInput();
  const app = express();
  app.use(express.json());
  app.post('/api/auth/login', (_req, res) => res.json({ token: 'test-double-only' }));
  app.put('/api/users/:id', async (req, res) => {
    if (plan.fault) {
      const id = plan.fault === 'other-user' ? '000000000000000000000001' : req.params.id;
      await models.UserModel.findByIdAndUpdate(id, req.body);
    }
    res.status(403).json({ error: 'Rejected' });
  });
  app.post('/api/products', async (req, res) => {
    if (plan.fault) await new models.ProductModel(req.body).save();
    res.status(409).json({ error: 'Duplicate ID' });
  });
  app.post('/api/orders', async (req, res) => {
    const save = plan.fault || plan.check.kind === 'notification-side-effect';
    const order = save ? await new models.OrderModel({ ...req.body,
      userId: '000000000000000000000001' }).save() : null;
    if (plan.check.kind === 'notification-side-effect') return res.json({ order });
    res.status(422).json({ error: 'Rejected' });
  });
  app.put('/api/orders/:id', async (_req, res) => {
    if (plan.fault) await new models.NotificationModel({ userId: '000000000000000000000001',
      message: 'Should not exist after a denied request' }).save();
    res.status(403).json({ error: 'Rejected' });
  });
  return executePlan(plan, { app, models, name: 'node_harness_stub',
    limitations: ['Fault injection fixture for oracle regression only; not an acceptance target.'] });
}

main().then(result => emitResult({ ok: true, ...result })).catch(fail);
