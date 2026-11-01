import type { SerializedResponse } from "@onapi/contracts";

/** Prepare download bytes without changing the response held in the store. */
export function responseDownload(
  response: SerializedResponse | undefined,
  defaultName: string,
) {
  if (!response) {
    return undefined;
  }
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
