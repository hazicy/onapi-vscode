import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import load from "../helpers/loadTypeScript.mjs";

const require = createRequire(import.meta.url);
const { requestUrl } = await load("packages/domain/src/index.ts", () => ({}));
const bundle = await build({
  entryPoints: [
    "apps/extension/src/features/requests/execution/http-runner.ts",
  ],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  plugins: [
    {
      name: "host-boundaries",
      setup(builder) {
        builder.onResolve({ filter: /^postman-collection$/ }, () => ({
          path: pathToFileURL(require.resolve("postman-collection")).href,
          external: true,
        }));
        builder.onResolve(
          {
            filter:
              /^(.*\/(?:project-config|request-storage|report-storage|collection-order|import-curl|prepare-options|html|host-utils|user-config)|\.\.\/request-status|@onapi\/domain)$/,
          },
          () => ({
            path: "host-stubs",
            namespace: "host-stubs",
          }),
        );
        builder.onLoad({ filter: /.*/, namespace: "host-stubs" }, () => ({
          contents: `
          export const getCurrentProjectConfig = context => context.config;
          export const getApiList = () => [];
          export const getApiListName = () => "test";
          export const getProjectWorkspace = () => ({});
          export const getProjectConfig = context => context.config;
          export const saveProjectConfig = () => {};
          export const setRequestResult = () => {};
          export const toPostmanCollection = () => {};
          export const createDefaultHttpConfig = () => {};
        `,
        }));
      },
    },
  ],
});
const { getCodeHarRequest, getResolvedCodeRequest } = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundle.outputFiles[0].text).toString("base64")
);

test("structured URLs join host segments with dots without a raw URL", () => {
  assert.equal(
    requestUrl({
      request: {
        url: {
          protocol: "https",
          host: ["api", "example", "com"],
          path: ["v1", "users"],
        },
      },
    }),
    "https://api.example.com/v1/users",
  );
});

for (const variables of ['{"id":"{{id}}"}', { id: "{{id}}" }, "", undefined]) {
  test(`GraphQL HAR preserves query and variables (${JSON.stringify(variables)})`, async () => {
    const context = {
      config: {
        http: {
          collection: {},
          environments: [],
          options: { globals: { values: [{ key: "id", value: "42" }] } },
        },
      },
    };
    const har = await getCodeHarRequest(
      {
        request: {
          method: "POST",
          url: "https://example.com/graphql",
          body: {
            mode: "graphql",
            graphql: {
              query: "query($id: ID!) { user(id: $id) { name } }",
              variables,
            },
          },
        },
      },
      context,
    );
    const postData = har.log.entries[0].request.postData;
    assert.equal(postData.mimeType, "application/json");
    assert.deepEqual(JSON.parse(postData.text), {
      query: "query($id: ID!) { user(id: $id) { name } }",
      variables: variables ? { id: "42" } : {},
    });
  });
}

for (const type of ["jwt", "asap"]) {
  test(`code generation preserves ${type} authentication and substituted attributes`, async () => {
    const context = {
      config: {
        http: {
          collection: {},
          environments: [],
          options: {
            globals: { values: [{ key: "secret", value: "resolved" }] },
          },
        },
      },
    };
    const request = await getResolvedCodeRequest(
      {
        request: {
          method: "GET",
          url: "https://example.com",
          auth: { type, [type]: [{ key: "secret", value: "{{secret}}" }] },
        },
      },
      context,
    );
    assert.equal(request.auth.type, type);
    assert.equal(request.auth.parameters().one("secret").value, "resolved");
  });
}
