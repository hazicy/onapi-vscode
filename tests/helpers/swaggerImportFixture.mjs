import load from "./loadTypeScript.mjs";
import { nativeDependency } from "./loadTypeScript.mjs";
export default async (
  filename = "packages/api-converter/src/formats/swagger-export.ts",
) => {
  let nextId = 0;
  const defaults = {
    example: [
      { example_id: "1", name: "Success" },
      { example_id: "2", name: "Error" },
    ],
    is_check_result: 1,
  };
  return await load(filename, (id) => {
    if (id === "lodash") return nativeDependency(id);
    if (id === "i18next") return { t: (key) => key };
    if (id === "@onapi/domain/utils/data-tools")
      return { snowflakeId: () => `id-${++nextId}` };
    if (id === "@onapi/domain/requests/constants/auth")
      return { DEFAULT_AUTH: { type: "noauth" } };
    if (id === "@onapi/domain/requests/constants/response")
      return {
        DEFAULT_API_RESPONSE: defaults,
        ERROR_RESPONSE: { example_id: "2", name: "Error" },
        SUCCESS_RESPONSE: { example_id: "1", name: "Success" },
      };
    throw new Error(`Unexpected dependency ${id}`);
  });
};
