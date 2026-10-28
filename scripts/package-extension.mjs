import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// The VSIX contains a native Oxfmt binding for the build machine's platform.
const platform =
  process.platform === "linux" &&
  !process.report.getReport().header.glibcVersionRuntime
    ? "alpine"
    : process.platform;
const architecture = process.arch === "arm" ? "armhf" : process.arch;
const target = `${platform}-${architecture}`;
const supported = new Set([
  "darwin-arm64",
  "darwin-x64",
  "win32-arm64",
  "win32-x64",
  "linux-x64",
  "linux-arm64",
  "linux-armhf",
  "alpine-x64",
  "alpine-arm64",
]);
if (!supported.has(target))
  throw new Error(`Unsupported VSIX target: ${target}`);
const result = spawnSync(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  [
    "exec",
    "vsce",
    "package",
    "--no-dependencies",
    "--target",
    target,
    "--out",
    "../../artifacts/",
  ],
  {
    cwd: fileURLToPath(new URL("../apps/extension", import.meta.url)),
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
