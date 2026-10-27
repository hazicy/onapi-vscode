import { DEFAULT_API_DATA } from "@onapi/http-model/requests/constants/default";
import { snowflakeId } from "@onapi/http-model/utils/data-tools";
import type { HttpCollectionItem } from "@onapi/http-model";

// curl-to-postmanv2 already produces the request schema used by the editor.
export function fromCurlPostmanRequest(
  request: any,
): HttpCollectionItem | false {
  if (!request || typeof request !== "object" || !request.url) {
    return false;
  }
  if (
    typeof request.url === "object" &&
    !request.url.raw &&
    !request.url.host
  ) {
    return false;
  }
  const id = snowflakeId();
  const definition = structuredClone(request);
  // curl-to-postmanv2 puts file paths in value; the SDK's native field is src.
  for (const parameter of definition.body?.formdata || []) {
    if (parameter.type === "file" && !parameter.src) {
      parameter.src = parameter.value;
      delete parameter.value;
    }
  }
  return {
    ...structuredClone(DEFAULT_API_DATA),
    id,
    request: definition,
  } as HttpCollectionItem;
}
