import {
  cp,
  mkdir,
  rm,
  readFile,
  writeFile,
  mkdtemp,
  readdir,
  rename,
  copyFile,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
export async function assembleExtension({
  workspaceRoot = root,
  clean = false,
} = {}) {
  const destination = path.join(workspaceRoot, "apps/extension/dist");
  const artifacts = path.join(workspaceRoot, "artifacts");
  await mkdir(artifacts, { recursive: true });
  const output = await mkdtemp(path.join(artifacts, ".extension-assembly-"));
  try {
    await cp(path.join(workspaceRoot, "apps/extension/.build"), output, {
      recursive: true,
    });
    await cp(
      path.join(workspaceRoot, "apps/webviews/dist"),
      path.join(output, "webviews"),
      { recursive: true },
    );
    await cp(
      path.join(workspaceRoot, "packages/runtime/dist"),
      path.join(output, "runtime"),
      { recursive: true },
    );
    await cp(
      path.join(workspaceRoot, "apps/webviews/public/images"),
      path.join(output, "images"),
      { recursive: true },
    );
    for (const name of [
      "scalar.standalone.js",
      "scalar.LICENSE.txt",
      "404.html",
    ]) {
      await cp(
        path.join(workspaceRoot, "apps/webviews/public", name),
        path.join(output, name),
      );
    }
    for (const file of ["README.md", "CHANGELOG.md", "LICENSE.txt"]) {
      await cp(
        path.join(workspaceRoot, file),
        path.join(workspaceRoot, "apps/extension", file),
      );
    }
    const readme = await readFile(
      path.join(workspaceRoot, "README.md"),
      "utf8",
    );
    const manifest = JSON.parse(
      await readFile(
        path.join(workspaceRoot, "apps/extension/package.json"),
        "utf8",
      ),
    );
    const repository =
      typeof manifest.repository === "string"
        ? manifest.repository
        : manifest.repository.url;
    const imageBase =
      repository.replace(/\.git$/, "") +
      "/raw/HEAD/apps/webviews/public/images/";
    await writeFile(
      path.join(workspaceRoot, "apps/extension/README.md"),
      readme.replaceAll("./apps/webviews/public/images/", imageBase),
    );
    await publishDirectory(output, destination);
    if (clean) {
      await pruneDirectory(output, destination);
    }
    console.log("Assembled apps/extension/dist");
  } finally {
    await rm(output, { recursive: true, force: true });
  }
}

// Never remove the published directory: F5 or a Worker can read it during a rebuild.
async function publishDirectory(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const target = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await publishDirectory(path.join(source, entry.name), target);
    } else {
      const temporary = `${target}.${process.pid}-${randomUUID()}.tmp`;
      try {
        await copyFile(path.join(source, entry.name), temporary);
        await rename(temporary, target);
      } finally {
        await rm(temporary, { force: true });
      }
    }
  }
}

// Full builds discard obsolete chunks/maps; watchers retain files used by open Webviews.
async function pruneDirectory(source, destination) {
  const entries = new Map(
    (await readdir(source, { withFileTypes: true })).map((entry) => [
      entry.name,
      entry,
    ]),
  );
  for (const entry of await readdir(destination, { withFileTypes: true })) {
    if (entry.name.endsWith(".tmp")) {
      continue;
    }
    const expected = entries.get(entry.name);
    const target = path.join(destination, entry.name);
    if (!expected) {
      await rm(target, { recursive: true, force: true });
    } else if (expected.isDirectory() && entry.isDirectory()) {
      await pruneDirectory(path.join(source, entry.name), target);
    }
  }
}
if (process.argv.includes("--watch")) {
  // Only the assembler writes the final extension directory. Poll stable producer
  // outputs rather than watching a directory that assembly itself modifies.
  const { stat } = await import("node:fs/promises");
  let previous = "";
  let assembling = false;
  setInterval(async () => {
    if (assembling) {
      return;
    }
    assembling = true;
    try {
      const files = [
        "apps/extension/.build/extension.js",
        "apps/webviews/dist/webviews.css",
        "packages/runtime/dist/postman.cjs",
        "packages/runtime/dist/worker.js",
      ];
      const signature = (
        await Promise.all(files.map((file) => stat(path.join(root, file))))
      )
        .map((info) => info.mtimeMs)
        .join(":");
      if (signature !== previous) {
        await assembleExtension();
        previous = signature;
      }
    } catch (error) {
      console.error("Extension assembly failed; retrying:", error.message);
    } finally {
      assembling = false;
    }
  }, 1000);
} else if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await assembleExtension({ clean: true });
}
