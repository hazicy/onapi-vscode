import { inflate } from "pako";
import { DOMParser } from "@xmldom/xmldom";

export function isXml(value: unknown): boolean {
  if (typeof value !== "string" || !value) {
    return false;
  }
  try {
    return Boolean(
      new DOMParser().parseFromString(value, "text/xml")?.documentElement,
    );
  } catch {
    return false;
  }
}

// Responses can contain plain bytes or gzip/zlib-compressed bytes.
export function bufferToRaw(data: any, mime: { mime?: string }) {
  const source =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : ArrayBuffer.isView(data)
        ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
        : new Uint8Array(data);
  let buffer = source;
  try {
    buffer = inflate(source);
  } catch {
    // Plain response bodies are already decoded bytes.
  }
  const chunks: string[] = [];
  for (let offset = 0; offset < buffer.length; offset += 8192) {
    chunks.push(String.fromCharCode(...buffer.subarray(offset, offset + 8192)));
  }
  return {
    buffer,
    raw: new TextDecoder("utf-8", { ignoreBOM: true }).decode(buffer),
    base64: `data:${mime.mime};base64,${btoa(chunks.join(""))}`,
  };
}
