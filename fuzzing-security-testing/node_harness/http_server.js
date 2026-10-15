/* Private HTTP target for blackbox fuzzing. Never loads the production server. */
const fs = require("fs");
const { createEnvironment } = require("./test_environment");

async function main() {
  const readyPath = process.argv[2];
  const port = readyPath ? 0 : Number(process.env.PORT || 5050);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Invalid PORT");
  const environment = await createEnvironment();
  environment.app.get("/__fuzzing_environment", (_request, response) => {
    response.json({ environment: environment.name });
  });
  const server = environment.app.listen(port, "127.0.0.1", () => {
    const ready = {
      environment: environment.name,
      url: `http://127.0.0.1:${server.address().port}`,
    };
    if (readyPath) fs.writeFileSync(readyPath, JSON.stringify(ready));
    console.log(`Simulated sales harness: ${ready.url} (${ready.environment})`);
    console.log("Stop with Ctrl+C. Restart to reset simulated data.");
  });
  const close = () => server.close(async () => {
    await environment.close();
    process.exit(0);
  });
  process.once("SIGTERM", close);
  process.once("SIGINT", close);
  server.once("error", error => {
    console.error(error);
    process.exitCode = 1;
  });
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
