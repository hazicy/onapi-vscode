import { readFile, rm } from "node:fs/promises";
const statePath = new URL(
  "../artifacts/debug-supervisor.json",
  import.meta.url,
);
try {
  const state = JSON.parse(await readFile(statePath, "utf8"));
  if (Number.isInteger(state.pid) && state.pid > 0) {
    try {
      process.kill(state.pid, "SIGTERM");
    } catch (error) {
      if (error.code !== "ESRCH") {
        throw error;
      }
    }
  }
  await rm(statePath, { force: true });
  console.log("Stopped onapi hot reload supervisor.");
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}
