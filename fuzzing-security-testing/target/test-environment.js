/* The fuzzing target is the local simulated sales app, never the real server. */
const path = require("path");

async function createEnvironment(backend = "stub") {
  if (backend !== "stub") throw new Error("This campaign only supports the simulated node_harness");
  // Set these before reading application config, including .env defaults.
  process.env.MONGODB_URI = "";
  process.env.GEMINI_API_KEY = "";
  return {
    app: require("./index"), models: require("./models"),
    indexPath: path.resolve(__dirname, "index.js"), name: "node_harness_stub",
    limitations: ["Datastore and services are simulated; conclusions apply to this harness only."],
    close: async () => {},
  };
}

module.exports = { createEnvironment };
