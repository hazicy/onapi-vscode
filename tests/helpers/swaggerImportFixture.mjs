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
    if (
      [
        "@/shared/utils/dataTools",
        "@onapi/http-model/utils/data-tools",
      ].includes(id)
    )
      return { snowflakeId: () => `id-${++nextId}` };
    if (
      [
        "@/features/requests/constants/auth",
        "@onapi/http-model/requests/constants/auth",
      ].includes(id)
    )
      return { DEFAULT_AUTH: { type: "noauth" } };
    if (
      [
        "@/features/requests/constants/response",
        "@onapi/http-model/requests/constants/response",
      ].includes(id)
    )
      return {
        DEFAULT_API_RESPONSE: defaults,
        ERROR_RESPONSE: { example_id: "2", name: "Error" },
        SUCCESS_RESPONSE: { example_id: "1", name: "Success" },
      };
    if (id === "@/shared/utils/common")
      return {
        getSubstring: (text, length) =>
          typeof text === "string" ? text.slice(0, length) : "",
      };
    if (id === "@/features/requests/utils/apis")
      return { genUrlByQuery: (url) => url };
    throw new Error(`Unexpected dependency ${id}`);
  });
};
