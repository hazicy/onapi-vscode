import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

const http = {
  collection: { variable: [{ key: "model", value: "collection" }] },
  options: { globals: { values: [{ key: "host", value: "global.invalid" }] } },
  environments: [
    {
      id: "dev",
      values: [
        { key: "host", value: "local.test" },
        { key: "model", value: "environment-model" },
        { key: "token", value: "environment-key" },
      ],
    },
  ],
  activeEnvironment: "dev",
};
const socket = await load(
  "apps/extension/src/features/requests/execution/socket-settings.ts",
  nativeDependency,
);
const { prepareProtocolRequest } = await load(
  "apps/extension/src/features/requests/execution/prepare-protocol-request.ts",
  (id) => {
    if (id.endsWith("/project-config"))
      return { getCurrentProjectConfig: () => ({ http }) };
    if (id === "../request-storage")
      return {
        getApiList: () => [
          {
            id: "folder",
            parentId: "0",
            variable: [
              { key: "model", value: "folder" },
              { key: "folderValue", value: "from-folder" },
            ],
          },
          { id: "ai", parentId: "folder" },
        ],
      };
    if (id === "./socket-settings") return socket;
    return nativeDependency(id);
  },
  { URL },
);

test("protocol execution resolves folder and environment variables without modifying the saved definition", () => {
  const command = {
    action: "ai_send",
    requestId: "run",
    data: {
      id: "ai",
      url: "https://{{host}}/v1",
      apiKey: "{{token}}",
      config: {
        model: "{{model}}",
        system: "{{folderValue}}",
        messages: [],
        headers: { Authorization: "Bearer {{token}}" },
      },
    },
  };
  const before = JSON.stringify(command);
  const prepared = prepareProtocolRequest(
    command,
    { globalState: { get: () => ({ proxy: 1, request_proxy_sys_open: 1 }) } },
    "http://proxy.local:8080",
  );
  assert.equal(prepared.message.data.url, "https://local.test/v1");
  assert.equal(prepared.message.data.config.model, "environment-model");
  assert.equal(prepared.message.data.config.system, "from-folder");
  assert.equal(prepared.message.data.apiKey, "environment-key");
  assert.equal(prepared.network.systemProxy, "http://proxy.local:8080");
  assert.equal(JSON.stringify(command), before);
});
test("protocol preparation validates network URLs after variable expansion and stdio commands separately", () => {
  const context = { globalState: { get: () => ({}) } };
  assert.throws(
    () =>
      prepareProtocolRequest(
        {
          action: "ai_send",
          requestId: "run",
          data: {
            id: "ai",
            url: "file:///tmp/test",
            config: { model: "test" },
          },
        },
        context,
        "",
      ),
    /HTTP or HTTPS/,
  );
  assert.throws(
    () =>
      prepareProtocolRequest(
        {
          action: "mcp_connect",
          requestId: "run",
          data: {
            id: "mcp",
            url: "",
            config: { transport: "stdio", command: "" },
          },
        },
        context,
        "",
      ),
    /command is required/,
  );
  const valid = prepareProtocolRequest(
    {
      action: "mcp_connect",
      requestId: "run",
      data: {
        id: "mcp",
        url: "",
        config: { transport: "stdio", command: "node" },
      },
    },
    context,
    "",
  );
  assert.equal(valid.message.data.config.command, "node");
});
