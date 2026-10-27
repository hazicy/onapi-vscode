import load from "./loadTypeScript.mjs";
import lodash0 from "lodash";
import lodash1 from "lodash";
const types = Object.fromEntries(
  [
    "api",
    "sse",
    "folder",
    "doc",
    "grpc",
    "socket",
    "socket_method",
    "websocket",
    "socketio",
    "graphql",
  ].map((type) => [type.toUpperCase(), type]),
);
const loadConverter = async (
  filename = "packages/api-converter/src/formats/native-export.ts",
) => {
  let nextId = 0;
  let clones = 0;
  const api = await load(filename, (id) => {
    if (id === "lodash")
      return {
        ...lodash0,
        cloneDeep: (value) => {
          clones++;
          return lodash1.cloneDeep(value);
        },
      };
    if (
      [
        "@/shared/utils/dataTools",
        "@onapi/http-model/utils/data-tools",
      ].includes(id)
    )
      return { snowflakeId: () => `id-${++nextId}` };
    if (id === "i18next") return { t: (key) => key };
    if (
      [
        "@/features/requests/constants",
        "@onapi/http-model/requests/constants/index",
      ].includes(id)
    )
      return { APIS_TARGET_TYPE_ENUM: types };
    if (
      [
        "@/features/requests/constants/request",
        "@onapi/http-model/requests/constants/request",
      ].includes(id)
    )
      return { DEFAULT_WEBSOCKET_MESSAGE: { type: "text", message: "" } };
    if (id === "@/shared/utils/common")
      return {
        getSubstring: (text, length) =>
          typeof text === "string" ? text.slice(0, length) : "",
      };
    if (id === "@/features/requests/utils/apis")
      return { genUrlByQuery: (url) => url };
    throw new Error(`Unexpected dependency: ${id}`);
  });
  return { ...api, cloneCount: () => clones };
};
const schema = {
  type: "object",
  properties: {
    child: { $ref: "#/definitions/model" },
    list: {
      type: "array",
      items: { anyOf: [{ $ref: "model" }, { type: "null" }] },
    },
  },
  ONAPI_REFS: {
    first: { ref: "model", description: "ref entry" },
    second: { $ref: "#/definitions/model" },
  },
  ONAPI_ORDERS: ["child", "list"],
  "x-schema-overrides": { child: { $ref: "model" } },
};
const request = {
  auth: { type: "bearer", bearer: { token: "secret" } },
  query: { parameter: [{ key: "q", value: "value" }] },
  header: { parameter: [{ key: "accept", value: "application/json" }] },
  body: {
    mode: "json",
    raw: '{"a":1}',
    raw_schema: schema,
    parameter: [],
    raw_parameter: [],
  },
};
const inputs = Object.values(types).map((kind, index) => ({
  id: String(index),
  parentId: "parent",
  kind,
  name: `Example ${kind}`,
  url: "https://example.com/path?q=value",
  request,
  response: {
    example: [{ example_id: "example", expect: { schema }, raw: "response" }],
  },
}));
export { loadConverter, schema, request, inputs };
