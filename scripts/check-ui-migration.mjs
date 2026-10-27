import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const forbidden =
  /(?:from\s*|import\s*\(?\s*|require\(\s*)['"](?:antd(?:\/[^'"]*)?|styled-components|@ant-design\/[^'"]*)['"]/;
const failures = [];
let modules = 0;
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(filename);
    else if (filename.endsWith(".css")) {
      if (filename.endsWith(".module.css")) {
        modules++;
        const component = filename.replace(/\.module\.css$/, ".tsx");
        if (!fs.existsSync(component))
          failures.push(
            `${path.relative(root, filename)}: missing matching component`,
          );
      }
      const source = fs.readFileSync(filename, "utf8");
      if (/beautify-[\w-]+/.test(source))
        failures.push(`${path.relative(root, filename)}: legacy UI selector`);
      if (/:global\b/.test(source))
        failures.push(`${path.relative(root, filename)}: global selector`);
      if (/\.slot-[\w-]+/.test(source))
        failures.push(`${path.relative(root, filename)}: shared slot selector`);
      if (
        filename.endsWith(".module.css") &&
        !/^(?:index|[A-Z][A-Za-z0-9]*)\.module\.css$/.test(entry.name)
      )
        failures.push(
          `${path.relative(root, filename)}: use ComponentName.module.css or index.module.css`,
        );
    } else if (/\.[cm]?[jt]sx?$/.test(filename)) {
      const source = fs.readFileSync(filename, "utf8");
      if (/beautify-[\w-]+|\bprefixCls\s*=/.test(source))
        failures.push(`${path.relative(root, filename)}: legacy UI prefix`);
      if (/\bAntd[A-Za-z]+|\buseAntdApp\b|\bgetAntdTheme\b/.test(source))
        failures.push(`${path.relative(root, filename)}: legacy UI name`);
      if (/\.defaultProps\s*=/.test(source))
        failures.push(
          `${path.relative(root, filename)}: function defaultProps`,
        );
      if (forbidden.test(source)) failures.push(path.relative(root, filename));
      if (/slots\.module\.css/.test(source))
        failures.push(`${path.relative(root, filename)}: shared slot import`);
      if (/\bui_[a-f0-9]{8}_\w+\b/.test(source)) {
        failures.push(
          `${path.relative(root, filename)}: compatibility marker class`,
        );
      }
    }
  }
}
visit(path.join(root, "apps/webviews/src"));
const manifest = JSON.parse(
  fs.readFileSync(
    new URL("../apps/webviews/package.json", import.meta.url),
    "utf8",
  ),
);
for (const name of ["antd", "styled-components", "@types/styled-components"]) {
  if (manifest.dependencies?.[name] || manifest.devDependencies?.[name])
    failures.push(`package.json: ${name}`);
}
if (failures.length)
  throw new Error(`UI migration violations:\n${failures.join("\n")}`);
console.log(
  `UI migration check passed: no legacy UI imports, direct dependencies, or global selectors; ${modules} CSS Modules.`,
);
