import { parentPort } from "node:worker_threads";
const { run, serialize } = await import("./postman.cjs").then(
  (module) => module.default,
);

parentPort.on("message", async ({ collection, options }) => {
  try {
    await run(collection, options, (event) =>
      parentPort.postMessage(JSON.parse(serialize(event))),
    );
  } catch (error) {
    parentPort.postMessage(JSON.parse(serialize({ type: "done", error })));
  }
});
