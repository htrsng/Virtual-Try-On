// Atomic compare-and-swap for callers that send the version they last read.
// Legacy callers remain compatible, but must send __v to detect stale writes.
async function versionedUpdate(Model, filter, body, extra = {}) {
  const expected = body.__v;
  if (expected !== undefined && (!Number.isSafeInteger(expected) || expected < 0)) {
    const error = new Error('Invalid version'); error.status = 400; throw error;
  }
  const { __v, _id, failedLoginCount, ...fields } = body;
  const query = expected === undefined ? filter : { ...filter, __v: expected };
  const updated = await Model.findOneAndUpdate(query,
    { $set: { ...fields, ...extra }, $inc: { __v: 1 } }, { new: true });
  if (!updated && expected !== undefined) {
    const existing = await Model.findOne(filter);
    if (existing) { const error = new Error('Stale version; reload before updating'); error.status = 409; throw error; }
  }
  return updated;
}
module.exports = { versionedUpdate };
