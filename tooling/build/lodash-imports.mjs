// Lodash's CommonJS root keeps the entire library for named imports. Resolve
// application imports to the published method modules without changing callers.
export function rewriteLodashImports(source) {
  return source.replace(
    /import\s*\{([^}]+)\}\s*from\s*["']lodash["'];?/g,
    (_match, bindings) =>
      bindings
        .split(",")
        .map((binding) => {
          const name = binding.trim();
          if (!name) return "";
          const [method, local = method] = name.split(/\s+as\s+/);
          if (!/^\w+$/.test(method) || !/^\w+$/.test(local)) {
            throw new Error(`Unsupported lodash import: ${binding}`);
          }
          return `import ${local} from "lodash/${method}.js";`;
        })
        .join("\n"),
  );
}

export function lodashMethodImports() {
  return {
    name: "lodash-method-imports",
    enforce: "pre",
    transform(source, id) {
      const filename = id.replaceAll("\\", "/");
      if (
        !filename.includes("/src/") ||
        filename.includes("/node_modules/") ||
        !/\.[jt]sx?$/.test(id) ||
        !source.includes("lodash")
      )
        return;
      const code = rewriteLodashImports(source);
      if (code !== source) return { code, map: null };
    },
  };
}
