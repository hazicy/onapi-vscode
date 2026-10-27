import { spawn } from "node:child_process";
import { open, readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { findDevServer } from "./dev-readiness.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const webviewRoot = path.join(root, "apps/webviews");
const artifacts = path.join(root, "artifacts");
await mkdir(artifacts, { recursive: true });
const statePath = path.join(artifacts, "debug-supervisor.json");

if (await findDevServer({ root: webviewRoot })) {
  console.log("Onapi hot reload is already ready on port 8080.");
} else {
  // The F5 task exits when ready. The supervisor owns and retains all watchers.
  const logPath = path.join(artifacts, `debug-startup-${process.pid}.log`);
  const log = await open(logPath, "w");
  const supervisor = spawn(process.execPath, ["scripts/dev.mjs"], {
    cwd: root,
    detached: true,
    stdio: ["ignore", log.fd, log.fd],
    env: { ...process.env, NO_COLOR: "1" },
  });
  let exited = false;
  let startupError;
  supervisor.on("error", (error) => {
    startupError = error;
  });
  supervisor.on("exit", (code) => {
    exited = true;
    startupError ||= new Error(`Development supervisor exited (${code}).`);
  });
  supervisor.unref();
  await log.close();
  await writeFile(statePath, JSON.stringify({ pid: supervisor.pid, logPath }));
  console.log(`Starting onapi hot reload. Log: ${logPath}`);
  let printed = 0;
  let ready = false;
  const deadline = Date.now() + 180000;
  try {
    while (Date.now() < deadline) {
      const output = await readFile(logPath, "utf8");
      process.stdout.write(output.slice(printed));
      printed = output.length;
      if (await findDevServer({ root: webviewRoot })) {
        ready = true;
        break;
      }
      if (startupError || exited) {
        throw startupError;
      }
      await setTimeout(250);
    }
    if (!ready) {
      throw new Error("Onapi hot reload startup timed out; see the log above.");
    }
    console.log("Onapi hot reload is ready; starting extension debugging.");
  } finally {
    if (!ready && supervisor.pid && !exited) {
      try {
        process.kill(supervisor.pid, "SIGTERM");
      } catch {}
    }
  }
}
