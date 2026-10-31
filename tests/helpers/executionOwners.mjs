import load, { nativeDependency } from "./loadTypeScript.mjs";
const core = await load(
  "packages/core/src/execution/scope.ts",
  nativeDependency,
  { console },
);
export const owners = await load(
  "apps/extension/src/platform/execution/owners.ts",
  (id) => {
    if (id === "@onapi/core") return core;
    throw new Error(id);
  },
  { console },
);
