import { bufferToRaw } from "@onapi/domain/utils/response-tools";
import type { SerializedResponse } from "@onapi/contracts";
import type { ApiSendingData } from "@onapi/domain/requests/types/send";

/** Prepare download bytes without changing the response held in the store. */
export function responseDownload(
  response: SerializedResponse | ApiSendingData["response"] | undefined,
  defaultName: string,
) {
  if (!response) {
    return undefined;
  }
  if (!("mime_type" in response)) {
    const mime =
      response.header?.find(
        (header) => header.key?.toLowerCase() === "content-type",
      )?.value || "application/octet-stream";
    const bytes = response.stream?.data;
    return {
      data: bytes ? Uint8Array.from(bytes) : response.body || "",
      name: `${defaultName}.txt`,
      mime,
    };
  }
  const { stream, mime_type, filename, fit_for_show } = response;
  const { raw, buffer } = bufferToRaw(stream?.data, mime_type);
  return {
    data: fit_for_show === "Monaco" ? raw : Uint8Array.from(buffer),
    name: filename || `${defaultName}.${mime_type?.ext || "bin"}`,
    mime: mime_type?.mime || "application/octet-stream",
  };
}
