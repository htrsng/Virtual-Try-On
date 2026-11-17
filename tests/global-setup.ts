const { configuration } = require('../qa/config.cjs');
const { start } = require('../qa/environment.cjs');

export default async function setup() {
  const environment = await start(configuration());
  return async () => { await environment.stop(); };
}
