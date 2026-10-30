import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";
const { createVariableContext, configuredVariableValues } = await load(
  "packages/domain/src/variables/context.ts",
  nativeDependency,
);
const sdk = await nativeDependency("postman-collection");

test("static variable precedence agrees with Postman SDK and retains source metadata", () => {
  const global = [
    { key: "shared", value: "global" },
    { key: "globalOnly", value: 0 },
  ];
  const collection = [
    { key: "shared", value: "collection" },
    { key: "object", value: { nested: true }, type: "any" },
  ];
  const env = [
    { key: "shared", value: "environment" },
    { key: "off", value: "ignored", disabled: true },
    { key: "empty", value: "" },
  ];
  const http = {
    options: { globals: { values: global } },
    collection: { variable: collection },
    environments: [{ id: "env", values: env }],
    activeEnvironment: "env",
  };
  for (const environmentId of ["env", "missing"]) {
    const context = createVariableContext(http, ["$timestamp"], environmentId);
    const scopes = [environmentId === "env" ? env : [], collection, global].map(
      (values) => new sdk.VariableList({}, values),
    );
    assert.equal(
      context.get("shared").value,
      sdk.Property.replaceSubstitutions("{{shared}}", scopes),
    );
    assert.equal(
      context.get("shared").scope,
      environmentId === "env" ? "environment" : "collection",
    );
    assert.equal(context.get("globalOnly").value, 0);
    assert.equal(context.get("object").value, collection[1].value);
    assert.equal(context.get("object").type, "any");
    assert.equal(context.has("off"), false);
    assert.equal(context.get("$timestamp").kind, "dynamic");
    assert.equal(
      Object.hasOwn(configuredVariableValues(context), "$timestamp"),
      false,
    );
  }
});

test("disabled narrower scopes fall back and explicit values can override dynamic names", () => {
  const http = {
    options: { globals: { values: [{ key: "host", value: "global" }] } },
    collection: {
      variable: [
        { key: "host", value: "collection" },
        { key: "$timestamp", value: false },
      ],
    },
    environments: [
      {
        id: "env",
        values: [{ key: "host", value: "disabled", disabled: true }],
      },
    ],
    activeEnvironment: "env",
  };
  const context = createVariableContext(http, ["$timestamp"]);
  assert.equal(context.get("host").value, "collection");
  assert.equal(context.get("$timestamp").value, false);
  assert.equal(context.get("$timestamp").kind, "value");
});
