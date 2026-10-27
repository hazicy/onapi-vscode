import load from "./loadTypeScript.mjs";
import { nativeDependency } from "./loadTypeScript.mjs";
const authTypes = [
  "noauth",
  "inherit",
  "kv",
  "bearer",
  "basic",
  "digest",
  "oauth1",
  "oauth2",
  "hawk",
  "awsv4",
  "ntlm",
  "edgegrid",
  "jwt",
  "asap",
];
const loadFormatter = async (
  filename = "apps/webviews/src/features/sync/components/ApisDiffJsonContent/utils.ts",
) =>
  await load(filename, (id) => {
    if (id === "lodash" || id === "dayjs") return nativeDependency(id);
    if (id === "i18next") return { t: (key) => key };
    if (id === "@/features/project/store/useProjectSetting")
      return {
        getState: () => ({
          markList: [{ mark_id: "done", name: "Done" }],
          customAttributeList: [],
        }),
      };
    if (id === "@/shared/utils/common")
      return {
        isJSON: (value) => {
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        },
      };
    throw new Error(`Unexpected dependency ${id}`);
  });
const parameter = {
  key: "key",
  value: "value",
  field_type: "String",
  description: "Description",
  not_null: 1,
};
const fixture = (type = "basic", mode = "json") => ({
  name: "Example",
  mark_id: "done",
  tags: ["tag"],
  method: "POST",
  url: "/example",
  description: "Description",
  request: {
    header: { parameter: [parameter] },
    query: { parameter: [parameter] },
    cookie: { parameter: [parameter] },
    restful: { parameter: [parameter] },
    auth: {
      type,
      [type]: {
        key: "auth-key",
        value: "auth-value",
        token: "token",
        username: "user",
        password: "password",
        clientId: "client",
        clientSecret: "secret",
      },
    },
    body: {
      mode,
      raw: '{"value":1}',
      raw_schema: '{"type":"object"}',
      parameter: [parameter],
      query_list: [
        { name: "Query", query: "query { user }", variables: '{"id":1}' },
      ],
    },
    pre_tasks: [{ type: "script" }],
    post_tasks: [],
    event: { parameter: [{ key: "event", value: "1", description: "Event" }] },
  },
  message: [],
  response: {
    example: [
      {
        expect: { name: "Success", code: "200", schema: '{"type":"object"}' },
        raw: '{"ok":true}',
      },
    ],
  },
});
export { loadFormatter, authTypes, fixture, parameter };
