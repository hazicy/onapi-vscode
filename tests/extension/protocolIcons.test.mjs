import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";
const { getProtocolIcon, getProtocolTreeIcon } = await load(
  "apps/extension/src/features/sidebar/protocol-icon.ts",
  (id) =>
    id === "vscode"
      ? {
          Uri: { joinPath: (...parts) => parts.join("/") },
          ThemeIcon: class {
            constructor(id, color) {
              Object.assign(this, { id, color });
            }
          },
          ThemeColor: class {
            constructor(id) {
              this.id = id;
            }
          },
        }
      : nativeDependency(id),
);

test("HTTP methods share the same glyph selection in trees and editor tabs", () => {
  for (const method of [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
    "TRACE",
    "post",
    "CUSTOM",
  ]) {
    const data = { kind: "api", request: { method } };
    const name = method === "CUSTOM" ? "http" : `http-${method.toLowerCase()}`;
    assert.equal(
      getProtocolTreeIcon(data, "list.errorForeground").id,
      `onapi-${name}`,
    );
    assert.equal(
      getProtocolTreeIcon(data, "list.errorForeground").color.id,
      "list.errorForeground",
    );
    const paths = getProtocolIcon({ extensionUri: "/extension" }, data);
    assert.equal(paths.light, `/extension/dist/images/${name}.svg`);
    assert.equal(paths.dark, `/extension/dist/images/${name}-dark.svg`);
  }
  assert.equal(
    getProtocolTreeIcon({ kind: "api", request: {} }).id,
    "onapi-http-get",
  );
  assert.equal(
    getProtocolTreeIcon({ kind: "graphql", request: { method: "POST" } }).id,
    "onapi-graphql",
  );
});
