import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  DEV_START,
  DEV_READY,
  waitForDevServer,
  findDevServer,
} from "./dev-readiness.mjs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const children = new Set();
let stopping = false;
const shutdown = new AbortController();
const session = randomUUID();
function launch(command, args, environment = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...environment },
    stdio: "inherit",
    shell: process.platform === "win32",
    detached: process.platform !== "win32",
  });
  children.add(child);
  return child;
}
function stop(code = 0) {
  if (stopping) {
    return;
  }
  stopping = true;
  shutdown.abort();
  for (const child of children) {
    if (!child.pid) {
      continue;
    }
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
      } else {
        process.kill(-child.pid, "SIGTERM");
      }
    } catch {}
  }
  process.exitCode = code;
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
console.log(DEV_START);
const existing = await findDevServer({
  root: path.join(root, "apps/webviews"),
  signal: shutdown.signal,
});
if (existing) {
  console.log(
    "Reusing this workspace's running hot reload server on port 8080.",
  );
  console.log(DEV_READY);
} else {
  console.log("Building development workspace...");
  try {
    await new Promise((resolve, reject) => {
      const initial = launch(pnpm, ["compile"], { ONAPI_DEV_SERVER: "true" });
      initial.on("error", reject);
      initial.on("exit", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`Initial build exited ${code}`)),
      );
    });
    for (const [command, args, env] of [
      [pnpm, ["--dir", "apps/webviews", "dev"], { ONAPI_DEV_SESSION: session }],
      [pnpm, ["--dir", "apps/extension", "dev"], { ONAPI_DEV_SERVER: "true" }],
      [pnpm, ["--dir", "packages/runtime", "dev"], {}],
      [process.execPath, ["scripts/assemble-extension.mjs", "--watch"], {}],
    ]) {
      const child = launch(command, args, env);
      child.on("error", (error) => {
        console.error(error);
        stop(1);
      });
      child.on("exit", (code) => {
        if (!stopping) {
          stop(code || 0);
        }
      });
    }

    await waitForDevServer({
      root: path.join(root, "apps/webviews"),
      session,
      signal: shutdown.signal,
    });
    if (!stopping) {
      console.log(DEV_READY);
    }
  } catch (error) {
    if (!stopping) {
      console.error(error);
      stop(1);
    }
  }
}
