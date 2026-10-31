import { createRequire } from "node:module";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(
  new URL("../apps/extension/package.json", import.meta.url),
);
const { runTests } = require("@vscode/test-electron");
const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(
  path.join(
    process.platform === "darwin" ? "/tmp" : os.tmpdir(),
    "onapi-editor-",
  ),
);
try {
  const userData = path.join(temporary, "profile");
  const workspace = path.join(temporary, "workspace");
  await mkdir(workspace, { recursive: true });
  await runTests({
    ...(process.env.VSCODE_EXECUTABLE_PATH
      ? { vscodeExecutablePath: process.env.VSCODE_EXECUTABLE_PATH }
      : {}),
    extensionDevelopmentPath: path.join(root, "apps/extension"),
    extensionTestsPath: path.join(root, "tests/native/editor-lifecycle.cjs"),
    extensionTestsEnv: {
      ONAPI_TEST_USER_DATA: userData,
      ONAPI_DEV_SERVER: "false",
    },
    launchArgs: [
      workspace,
      "--user-data-dir",
      userData,
      "--extensions-dir",
      path.join(temporary, "extensions"),
      "--disable-workspace-trust",
      "--skip-welcome",
      "--skip-release-notes",
    ],
  });
} finally {
  await rm(temporary, { recursive: true, force: true });
}
