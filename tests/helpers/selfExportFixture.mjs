import load from "./loadTypeScript.mjs";
import lodash0 from "lodash";
import lodash1 from "lodash";
const types = Object.fromEntries(
  [
    "api",
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
    if (id === "@onapi/domain/utils/data-tools")
      return { snowflakeId: () => `id-${++nextId}` };
    if (id === "i18next") return { t: (key) => key };
    if (id === "@onapi/domain/requests/constants/index")
      return { APIS_TARGET_TYPE_ENUM: types };
    if (id === "@onapi/domain/requests/constants/request")
      return { DEFAULT_WEBSOCKET_MESSAGE: { type: "text", message: "" } };
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
