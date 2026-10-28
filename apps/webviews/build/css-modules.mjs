import { createHash } from "node:crypto";

/** Scope every class to its owning CSS Module. */
export function generateScopedName(name, filename) {
  const normalized = filename.replaceAll("\\", "/");
  const relative = normalized.includes("/src/")
    ? `src/${normalized.split("/src/").at(-1)}`
    : normalized;
  const hash = createHash("sha256")
    .update(`${relative}:${name}`)
    .digest("hex")
    .slice(0, 8);
  return `_${name}_${hash}`;
}
