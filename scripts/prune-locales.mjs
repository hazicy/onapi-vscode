import fs from "node:fs";
import path from "node:path";
import { parseSync } from "oxc-parser";

const root = path.resolve(import.meta.dirname, "..");
const write = process.argv.includes("--write");
const references = new Set();
const dynamicPatterns = [];
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function visit(node) {
  if (!node || typeof node !== "object") return;
  // Include keys passed through lookup tables and component props as well as t().
  if (node.type === "Literal" && typeof node.value === "string") {
    references.add(node.value);
  }
  if (node.type === "TemplateLiteral") {
    if (node.expressions.length === 0) {
      references.add(node.quasis[0].value.cooked);
    }
  }
  if (
    node.type === "CallExpression" &&
    (node.callee.name === "t" || node.callee.property?.name === "t")
  ) {
    const argument = node.arguments[0];
    if (argument?.type === "TemplateLiteral" && argument.expressions.length) {
      dynamicPatterns.push(
        new RegExp(
          "^" +
            argument.quasis
              .map((part) => escape(part.value.cooked))
              .join(".*") +
            "$",
        ),
      );
    }
  }
  for (const child of Object.values(node)) {
    if (Array.isArray(child)) child.forEach(visit);
    else if (child && typeof child === "object") visit(child);
  }
}

function scan(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) scan(filename);
    else if (/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) {
      const { program, errors } = parseSync(
        filename,
        fs.readFileSync(filename, "utf8"),
      );
      if (errors.length)
        throw new Error(`Cannot audit ${filename}: ${JSON.stringify(errors)}`);
      visit(program);
    }
  }
}
for (const group of ["apps", "packages"]) {
  for (const entry of fs.readdirSync(path.join(root, group))) {
    const source = path.join(root, group, entry, "src");
    if (fs.existsSync(source)) scan(source);
  }
}

function used(key) {
  // Keep i18next plural/context variants when the unsuffixed key is referenced.
  return (
    references.has(key) ||
    references.has(key.replace(/_(?:zero|one|two|few|many|other)$/, "")) ||
    dynamicPatterns.some((pattern) => pattern.test(key))
  );
}
let unused = 0;
for (const language of ["en_US", "zh_CN"]) {
  const filename = path.join(
    root,
    "packages/domain/src/locale",
    `${language}.json`,
  );
  let kept = 0,
    removed = 0;
  function prune(value, prefix = "") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      if (used(prefix)) {
        kept++;
        return value;
      }
      removed++;
      return undefined;
    }
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      const next = prune(child, prefix ? `${prefix}.${key}` : key);
      if (next !== undefined) result[key] = next;
    }
    return Object.keys(result).length ? result : undefined;
  }
  const result = prune(JSON.parse(fs.readFileSync(filename, "utf8")));
  unused += removed;
  if (write) fs.writeFileSync(filename, JSON.stringify(result, null, 2) + "\n");
  console.log(
    `${language}: ${kept} used keys, ${removed} ${write ? "removed" : "unused"} keys`,
  );
}
// VS Code contribution labels use %key% references rather than i18next calls.
const manifest = fs.readFileSync(
  path.join(root, "apps/extension/package.json"),
  "utf8",
);
const contributionKeys = new Set(
  [...manifest.matchAll(/%([^%\s]+)%/g)].map((match) => match[1]),
);
for (const name of ["package.nls.json", "package.nls.zh-cn.json"]) {
  const filename = path.join(root, "apps/extension", name);
  const data = JSON.parse(fs.readFileSync(filename, "utf8"));
  const entries = Object.entries(data).filter(([key]) =>
    contributionKeys.has(key),
  );
  const removed = Object.keys(data).length - entries.length;
  unused += removed;
  if (write)
    fs.writeFileSync(
      filename,
      JSON.stringify(Object.fromEntries(entries), null, 2) + "\n",
    );
  console.log(
    `${name}: ${entries.length} used keys, ${removed} ${write ? "removed" : "unused"} keys`,
  );
}
if (!write && unused) process.exitCode = 1;
