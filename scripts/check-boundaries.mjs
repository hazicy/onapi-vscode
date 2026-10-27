import fs from "node:fs";
import path from "node:path";
import { builtinModules } from "node:module";
import { parseSync, Visitor } from "oxc-parser";
const root = path.resolve(import.meta.dirname, "..");
const builtins = new Set(
  builtinModules.flatMap((name) => [name, `node:${name}`]),
);
const failures = [];
// Exact legacy edges are tracked while application-aware shared components migrate.
// New edges fail the check, and removed edges must be removed from this list.
const webviewLegacyEdges = new Set(
  JSON.parse(
    fs.readFileSync(
      new URL("../tooling/webview-boundary-exceptions.json", import.meta.url),
      "utf8",
    ),
  ),
);
const usedWebviewLegacyEdges = new Set();
// Models are the bottom layer; wire contracts may depend only on those models.
const sharedWorkspaceDependencies = {
  "packages/domain": new Set(),
  "packages/contracts": new Set(["@onapi/domain"]),
};
const owners = [
  "apps/extension",
  "apps/webviews",
  "packages/domain",
  "packages/contracts",
  "packages/core",
  "packages/runtime",
  "packages/api-converter",
];
for (const owner of owners) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, owner, "package.json"), "utf8"),
  );
  const declared = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
  };
  const allowed = sharedWorkspaceDependencies[owner];
  if (allowed) {
    for (const name of Object.keys(declared)) {
      if (name.startsWith("@onapi/") && !allowed.has(name)) {
        failures.push(`${owner}: forbidden shared-layer dependency ${name}`);
      }
    }
  }
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filename);
      else if (/\.[jt]sx?$/.test(filename) && !filename.endsWith(".d.ts")) {
        const { program, errors } = parseSync(
          filename,
          fs.readFileSync(filename, "utf8"),
        );
        if (errors.some((error) => error.severity === "Error")) {
          throw new Error(
            `Cannot parse ${filename}: ${errors.map((error) => error.message).join("; ")}`,
          );
        }
        const imports = [];
        new Visitor({
          ImportDeclaration(node) {
            imports.push(node.source.value);
          },
          ExportNamedDeclaration(node) {
            if (node.source) imports.push(node.source.value);
          },
          ExportAllDeclaration(node) {
            imports.push(node.source.value);
          },
          ImportExpression(node) {
            if (
              node.source.type === "Literal" &&
              typeof node.source.value === "string"
            )
              imports.push(node.source.value);
          },
        }).visit(program);
        for (const id of imports) {
          if (owner === "apps/webviews") {
            const sourceRoot = path.join(root, owner, "src");
            const source = path
              .relative(sourceRoot, filename)
              .split(path.sep)
              .join("/");
            const targetPath = id.startsWith("@/")
              ? path.resolve(sourceRoot, id.slice(2))
              : id.startsWith(".")
                ? path.resolve(path.dirname(filename), id)
                : undefined;
            const target =
              targetPath &&
              path.relative(sourceRoot, targetPath).split(path.sep).join("/");
            if (
              source.startsWith("shared/") &&
              (target?.startsWith("features/") || target?.startsWith("app/"))
            ) {
              const edge = `${source} -> ${target}`;
              if (webviewLegacyEdges.has(edge))
                usedWebviewLegacyEdges.add(edge);
              else
                failures.push(
                  `${owner}/src/${source}: shared layer imports ${target}`,
                );
            }
            if (
              source === "app/store/index.ts" &&
              target?.startsWith("features/")
            )
              failures.push(
                `${owner}: application store barrel re-exports a feature store`,
              );
          }
          if (id.startsWith(".")) {
            const target = path.resolve(path.dirname(filename), id);
            if (!target.startsWith(path.join(root, owner) + path.sep))
              failures.push(
                `${path.relative(root, filename)}: cross-package relative import ${id}`,
              );
          } else if (!id.startsWith("@/")) {
            const name = id.startsWith("@")
              ? id.split("/").slice(0, 2).join("/")
              : id.split("/")[0];
            if (builtins.has(id)) {
              if (owner !== "apps/extension" && owner !== "packages/runtime")
                failures.push(
                  `${path.relative(root, filename)}: Node API ${id}`,
                );
            } else if (id === "vscode") {
              if (owner !== "apps/extension")
                failures.push(`${owner}: vscode dependency`);
            } else if (
              name !== manifest.name &&
              !declared[name] &&
              !declared["@types/" + name]
            )
              failures.push(
                `${path.relative(root, filename)}: undeclared dependency ${name}`,
              );
            if (owner === "apps/webviews" && name === "@onapi/runtime")
              failures.push(`${owner}: imports Node runtime`);
            if (
              owner.startsWith("packages/") &&
              ["@onapi/webviews", "onapi"].includes(name)
            )
              failures.push(`${owner}: depends on application`);
          }
        }
      }
    }
  }
  visit(path.join(root, owner, "src"));
}
for (const edge of webviewLegacyEdges) {
  if (!usedWebviewLegacyEdges.has(edge))
    failures.push(`Unused Webview boundary exception: ${edge}`);
}
if (failures.length)
  throw new Error(`Workspace boundary violations:\n${failures.join("\n")}`);
console.log("Workspace boundaries and declared dependencies passed.");
