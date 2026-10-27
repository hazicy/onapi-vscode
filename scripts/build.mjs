import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assembleExtension } from "./assemble-extension.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
async function run(args) {
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      args,
      { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
    );
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`pnpm ${args.join(" ")} exited ${code}`)),
    );
  });
}
const development = process.argv.includes("--development");
await run([
  "--dir",
  "apps/webviews",
  "build",
  ...(development ? ["--mode", "development"] : []),
]);
await run([
  "--dir",
  "packages/runtime",
  "build",
  ...(development ? ["--development"] : []),
]);
await run([
  "--dir",
  "apps/extension",
  "build",
  ...(development ? ["--mode", "development"] : []),
]);
await assembleExtension({ clean: true });
await run(["exec", "node", "scripts/check-extension.mjs"]);
await run(["exec", "node", "scripts/check-webviews.mjs"]);
await run(["check:boundaries"]);
await run(["check:ui"]);
