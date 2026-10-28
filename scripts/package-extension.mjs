import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const result = spawnSync(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["exec", "vsce", "package", "--no-dependencies", "--out", "../../artifacts/"],
  {
    cwd: fileURLToPath(new URL("../apps/extension", import.meta.url)),
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
