const mongoose = require('mongoose');
function live(req, res) { res.json({ status: 'alive', service: 'vfitai-api' }); }
async function ready(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) throw new Error('Database disconnected');
    await mongoose.connection.db.command({ ping: 1 }, { timeoutMS: 1500 });
    const runId = process.env.NODE_ENV === 'test' ? process.env.QA_RUN_ID : undefined;
    if (runId) {
      const marker = await mongoose.connection.db.collection('_qa_owner').findOne({ _id: runId, state: 'ready' });
      if (!marker || !mongoose.connection.name.startsWith('vfitai_test_')) throw new Error('Test fixture not ready');
    }
    res.json({ status: 'ready', service: 'vfitai-api', database: 'ready', ...(runId ? { runId } : {}) });
  } catch (_) { res.status(503).json({ status: 'not_ready', service: 'vfitai-api', database: 'unavailable' }); }
}
module.exports = { live, ready };
