import fs from "node:fs/promises";
import path from "node:path";
import protobuf from "protobufjs";
import type { GrpcProtoFile } from "@onapi/domain/requests/grpc";

/** Resolve local imports once and persist their contents, so saved definitions remain portable. */
export async function importProtoFiles(
  paths: string[],
  includeDirs: string[] = [],
): Promise<GrpcProtoFile[]> {
  if (!paths.length) {
    return [];
  }
  const sources = new Map<string, string>();
  const roots = [
    ...new Set([...includeDirs, ...paths.map((file) => path.dirname(file))]),
  ];
  let total = 0;
  const visit = async (file: string) => {
    const absolute = path.resolve(file);
    if (sources.has(absolute)) {
      return;
    }
    if (sources.size >= 100) {
      throw new Error(
        "A service definition may contain at most 100 proto files",
      );
    }
    const content = await fs.readFile(absolute, "utf8");
    total += Buffer.byteLength(content);
    if (
      Buffer.byteLength(content) > 2 * 1024 * 1024 ||
      total > 8 * 1024 * 1024
    ) {
      throw new Error("Proto definitions exceed the 8 MB import limit");
    }
    sources.set(absolute, content);
    const parsed = protobuf.parse(content, { keepCase: true });
    for (const dependency of parsed.imports ?? []) {
      if (
        dependency.startsWith("google/protobuf/") &&
        protobuf.common.get(dependency)
      ) {
        continue;
      }
      const candidates = [
        path.resolve(path.dirname(absolute), dependency),
        ...roots.map((root) => path.resolve(root, dependency)),
      ];
      let found: string | undefined;
      for (const candidate of candidates) {
        try {
          await fs.access(candidate);
          found = candidate;
          break;
        } catch {
          /* Try the next import root. */
        }
      }
      if (!found) {
        throw new Error(
          `Missing imported proto: ${dependency}. Select its directory or include it in the import.`,
        );
      }
      await visit(found);
    }
  };
  for (const file of paths) {
    await visit(file);
  }
  let base = path.dirname(path.resolve(paths[0]));
  while (
    [...sources.keys()].some((file) =>
      path.relative(base, file).startsWith(`..${path.sep}`),
    )
  ) {
    base = path.dirname(base);
  }
  return [...sources].map(([name, content]) => ({
    name: path.relative(base, name).split(path.sep).join("/"),
    content,
  }));
}

export async function importProtoDirectory(directory: string) {
  const files = (await fs.readdir(directory, { recursive: true }))
    .filter((file) => file.endsWith(".proto"))
    .map((file) => path.join(directory, file));
  if (!files.length) {
    throw new Error("No .proto files were found in the selected directory");
  }
  if (files.length > 100) {
    throw new Error(
      "Select a service directory containing at most 100 proto files",
    );
  }
  return importProtoFiles(files, [directory]);
}
