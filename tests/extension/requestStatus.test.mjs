import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";
const editorEnv = { language: "en" };
const {
  requestDecoration: decorate,
  setRequestDraft,
  setRequestResult,
} = await load(
  "apps/extension/src/features/requests/request-status.ts",
  (id) =>
    id === "vscode"
      ? {
          env: editorEnv,
          EventEmitter: class {
            fire() {}
          },
        }
      : nativeDependency(id),
);
const request = {
  id: "r",
  kind: "api",
  request: { method: "GET", url: "/users" },
};
const get = (workspace = "one", data = request, config = {}) =>
  decorate(workspace, data, config, [data]);
test("results, dirty state, priority, clearing drafts, and workspace isolation", () => {
  assert.equal(get(), undefined);
  setRequestResult("one", "r", { code: 200 });
  assert.equal(get().badge, undefined);
  assert.equal(get().color, undefined);
  assert.match(get().tooltip, /Last run\n.*succeeded/);
  setRequestResult("one", "r", { code: 404 });
  assert.equal(get().badge, undefined);
  assert.match(get().tooltip, /failed/);
  setRequestResult("one", "r", undefined, { code: "ETIMEDOUT" });
  assert.equal(get().badge, undefined);
  assert.match(get().tooltip, /timed out/);
  setRequestDraft("one", "r", request);
  assert.equal(get().badge, "M");
  assert.equal(get().color, undefined);
  assert.match(get().tooltip, /timed out/);
  setRequestDraft("one", "r", { ...request, request: { url: "{{missing}}" } });
  assert.equal(get().badge, "M");
  assert.equal(get().color, undefined);
  assert.match(get().tooltip, /Missing variables\n- missing\n\n/);
  setRequestDraft("one", "r", { ...request, request: { url: "" } });
  assert.equal(get().badge, "M");
  assert.equal(get().color, undefined);
  assert.match(get().tooltip, /Missing URL/);
  setRequestDraft("one", "r");
  assert.equal(get().badge, undefined);
  assert.match(get().tooltip, /timed out/);
  assert.equal(get("two"), undefined);
});
test("native validation ignores disabled entries and examples and follows variable scopes", () => {
  const config = {
    http: {
      collection: { variable: [] },
      options: { globals: { values: [] } },
      activeEnvironment: "env",
      environments: [
        {
          id: "env",
          values: [
            { key: "host", value: "{{domain}}" },
            { key: "domain", value: "example.com" },
            { key: "empty", value: "" },
          ],
        },
      ],
    },
  };
  const data = {
    ...request,
    request: {
      url: "https://{{host}}/{{empty}}/{{$randomUUID}}",
      header: [{ key: "", value: "{{disabled}}", disabled: true }],
    },
    response: [{ body: "{{example}}" }],
  };
  assert.equal(get("validation", data, config), undefined);
  data.request.header.push({ key: "", value: "bad" });
  assert.match(get("validation", data, config).tooltip, /Empty parameter name/);
  data.request.header = [];
  data.request.body = {
    mode: "raw",
    raw: "{bad}",
    options: { raw: { language: "json" } },
  };
  assert.match(get("validation", data, config).tooltip, /Invalid JSON body/);
  assert.equal(get("validation", data, config).color, "list.errorForeground");
  delete data.request.body;
  config.http.environments[0].values[1].value = "{{unknown}}";
  assert.match(get("validation", data, config).tooltip, /unknown/);
  assert.equal(
    get("validation", { ...data, kind: "folder" }, config),
    undefined,
  );
});
test("folder traversal cannot loop and uses native collection variables", () => {
  const data = {
    ...request,
    parentId: "folder",
    request: { url: "{{baseUrl}}/users" },
  };
  const folder = {
    id: "folder",
    parentId: "folder",
    kind: "folder",
    event: [],
  };
  const config = {
    http: {
      collection: {
        variable: [{ key: "baseUrl", value: "https://example.com" }],
      },
      options: { globals: { values: [] } },
      environments: [],
    },
  };
  assert.equal(decorate("inherited", data, config, [data, folder]), undefined);
});

test("tooltip follows the editor language without bilingual labels", () => {
  try {
    editorEnv.language = "zh-cn";
    const data = { ...request, id: "localized", request: { url: "" } };
    setRequestDraft("localized", data.id, data);
    setRequestResult("localized", data.id, { code: 200 });
    const zh = get("localized", data).tooltip;
    assert.match(zh, /配置未完成\n- 缺少 URL/);
    assert.match(zh, /有未保存的修改/);
    assert.match(zh, /上次运行\n请求成功/);
    assert.doesNotMatch(
      zh,
      /Incomplete configuration|Unsaved changes|Last run|Request succeeded/,
    );
    editorEnv.language = "en";
    // New result messages use the current editor language, like a restarted host.
    setRequestResult("localized", data.id, undefined, { code: "ETIMEDOUT" });
    const en = get("localized", data).tooltip;
    assert.match(en, /Incomplete configuration\n- Missing URL/);
    assert.match(en, /Last run\nRequest timed out/);
    assert.doesNotMatch(en, /配置|未保存|上次运行|请求超时/);
  } finally {
    editorEnv.language = "en";
  }
});
