import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "./helpers/loadTypeScript.mjs";

const model = await load("packages/domain/src/index.ts", nativeDependency);
const { requestCollection } = await load(
  "apps/extension/src/features/requests/execution/http-runner.ts",
  (id) => {
    if (id === "./merge-http-state") return { mergeHttpState() {} };
    if (id === "@onapi/domain") return model;
    if (id === "@onapi/runtime/http/adapter") return { HttpAdapter: class {} };
    if (id === "../../../platform/execution/service")
      return { executionService: {} };
    if (
      /\/(?:project-config|request-storage|report-storage|collection-order|import-curl|prepare-options|html|host-utils|user-config)$/.test(
        id,
      )
    )
      return {
        getCurrentProjectConfig: (context) => context.config,
        getApiListName: () => "test",
        getApiList: (context) => structuredClone(context.items || []),
        getProjectWorkspace() {},
        getProjectConfig: (context) => context.config,
        saveProjectConfig() {},
      };
    if (id === "../request-status") return { setRequestResult() {} };
    return nativeDependency(id);
  },
);
const plain = (value) => JSON.parse(JSON.stringify(value));

test("sending an edited HTTP item uses the saved SDK projection and retains folder inheritance", () => {
  const context = { config: { http: model.createDefaultHttpConfig() } };
  const folder = {
    id: "folder",
    name: "Folder",
    auth: { type: "basic", basic: [{ key: "username", value: "alice" }] },
    variable: [{ key: "path", value: "users" }],
    event: [
      {
        listen: "prerequest",
        script: { exec: ["pm.variables.set('ready', true)"] },
      },
    ],
    item: [
      {
        id: "request",
        name: "Saved",
        request: { method: "GET", url: "https://example.test" },
      },
    ],
  };
  context.items = model.fromPostmanCollection({ item: [folder] });
  const before = plain(context.config);
  const draft = {
    id: "request",
    kind: "api",
    parentId: "folder",
    project_id: "project",
    name: "Edited",
    is_changed: 1,
    request: {
      method: "POST",
      url: {
        raw: "https://example.test/{{path}}",
        host: ["example", "test"],
        path: ["{{path}}"],
        protocol: "https",
      },
      header: [{ key: "X-Test", value: "yes", disabled: true }],
      body: {
        mode: "raw",
        raw: '{"id":1}',
        options: { raw: { language: "json" } },
      },
    },
    event: [
      {
        listen: "test",
        script: {
          exec: ["pm.test('ok', () => pm.response.to.have.status(200))"],
        },
      },
    ],
    response: [],
  };
  const snapshot = plain(draft);
  const collection = requestCollection(draft, context);
  const sent = collection.item[0].item[0];
  assert.deepEqual(
    plain(sent),
    plain(
      model.toPostmanCollection([{ ...draft, parentId: "0" }], { item: [] })
        .item[0],
    ),
  );
  assert.deepEqual(plain(sent.request), draft.request);
  assert.deepEqual(plain(sent.event), draft.event);
  assert.deepEqual(plain(collection.item[0].auth), folder.auth);
  assert.deepEqual(plain(collection.item[0].event), folder.event);
  assert.equal("parentId" in sent, false);
  assert.equal("is_changed" in sent, false);
  assert.equal("pre_tasks" in sent.request, false);
  assert.deepEqual(plain(context.config), before);
  assert.deepEqual(plain(draft), snapshot);
});

test("an unsaved GraphQL request is appended with its SDK body and scripts intact", () => {
  const context = { config: { http: model.createDefaultHttpConfig() } };
  const request = {
    method: "POST",
    url: "https://example.test/graphql",
    body: {
      mode: "graphql",
      graphql: { query: "{ users { id } }", variables: { limit: 1 } },
    },
  };
  const event = [
    {
      listen: "prerequest",
      script: { exec: ["pm.environment.set('sent', 'yes')"] },
    },
  ];
  const collection = requestCollection(
    {
      id: "new",
      parentId: "missing",
      kind: "graphql",
      name: "GraphQL",
      request,
      event,
    },
    context,
  );
  assert.deepEqual(plain(collection.item[0]), {
    id: "new",
    name: "GraphQL",
    event,
    request,
  });
  assert.equal(context.config.http.collection.item, undefined);
});

test("edited URLs extract path variables before file extensions and preserve their values", () => {
  const url = model.editedUrl(
    "https://example.test/:id.json/:id.xml/:name.csv",
    {
      variable: [
        { key: "id", value: "123" },
        { key: "name", value: "report" },
      ],
    },
  );
  assert.deepEqual(plain(url.variable), [
    { key: "id", value: "123" },
    { key: "name", value: "report" },
  ]);
  assert.deepEqual(plain(url.path), [":id.json", ":id.xml", ":name.csv"]);
});
