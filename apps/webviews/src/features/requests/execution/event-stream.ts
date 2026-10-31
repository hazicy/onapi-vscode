import type { HttpExecutionState } from "./http-state";

export interface ServerSentEvent {
  event: string;
  id?: string;
  data: string;
}

/** Parse complete SSE frames, retaining multiline data and ignoring heartbeats. */
export function parseEventStream(body: string): ServerSentEvent[] {
  const result: ServerSentEvent[] = [];
  // A trailing CR can be the first half of a CRLF split across network chunks.
  const normalized = body
    .replace(/\r\n/g, "\n")
    .replace(/\r(?!$)/g, "\n")
    .replace(/^\uFEFF/, "");
  const frames = normalized.split("\n\n");
  frames.pop(); // An event is dispatched only after its terminating blank line.
  let id: string | undefined;
  for (const frame of frames) {
    let event = "message";
    const data: string[] = [];
    for (const line of frame.split("\n")) {
      if (!line || line.startsWith(":")) {
        continue;
      }
      const colon = line.indexOf(":");
      const field = colon < 0 ? line : line.slice(0, colon);
      const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "");
      if (field === "event") {
        event = value || "message";
      }
      if (field === "id" && !value.includes("\0")) {
        id = value;
      }
      if (field === "data") {
        data.push(value);
      }
    }
    if (data.length) {
      result.push({ event, id, data: data.join("\n") });
    }
  }
  return result;
}

export function isEventStream(state?: HttpExecutionState): boolean {
  if (state?.result?.executionId !== state?.executionId) {
    return false;
  }
  return !!state?.result?.response.header?.some(
    (header) =>
      header.key?.toLowerCase() === "content-type" &&
      header.value?.split(";", 1)[0].trim().toLowerCase() ===
        "text/event-stream",
  );
}

export function eventStreamText(state?: HttpExecutionState): string {
  return (state?.events || [])
    .filter((event) => event.type === "responseData")
    .map((event) => String(event.data ?? ""))
    .join("");
}
