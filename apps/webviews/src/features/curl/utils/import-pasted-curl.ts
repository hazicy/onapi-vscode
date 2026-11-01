import type { ConvertedCurlRequest } from "@/features/curl/types";

/** Load the converter only when a cURL command is pasted. */
export async function importPastedCurl(
  source: string,
): Promise<ConvertedCurlRequest | undefined> {
  const [{ fromCurlPostmanRequest }, { convert, validate }] = await Promise.all(
    [
      import("@onapi/domain/curl/utils/postman-request"),
      import("curl-to-postmanv2"),
    ],
  );
  if (!validate(source).result) {
    throw new Error("Invalid cURL command");
  }
  return new Promise((resolve, reject) => {
    convert({ type: "string", data: source }, (error: unknown, result: any) => {
      if (error || (result?.error && !result?.result)) {
        reject(error || new Error("cURL conversion failed"));
        return;
      }
      try {
        const item = fromCurlPostmanRequest(result?.output?.[0]?.data);
        resolve(item && item.request ? { request: item.request } : undefined);
      } catch (error) {
        reject(error);
      }
    });
  });
}
