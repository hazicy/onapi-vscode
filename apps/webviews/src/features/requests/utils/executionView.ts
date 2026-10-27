/** Runtime messages and imported examples cross a JSON boundary before reaching the UI. */
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export interface SdkHeader {
  key: string;
  value: string;
}
function parameterList(value: unknown): SdkHeader[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(record)
    .filter((row) => typeof row.key === "string")
    .map((row) => ({
      key: String(row.key),
      value:
        typeof row.value === "string" ? row.value : String(row.value ?? ""),
    }));
}

export function sdkResponseView(value: unknown) {
  if (!record(value) || !Array.isArray(value.header)) {
    return undefined;
  }
  const data = record(value.stream) ? value.stream.data : undefined;
  const stream =
    Array.isArray(data) && data.every((byte) => typeof byte === "number")
      ? { type: "Buffer", data }
      : undefined;
  return {
    header: parameterList(value.header),
    body: typeof value.body === "string" ? value.body : undefined,
    stream,
    responseTime:
      typeof value.responseTime === "number" ? value.responseTime : undefined,
    responseSize:
      typeof value.responseSize === "number" ? value.responseSize : undefined,
  };
}

export function sdkRequestView(value: unknown) {
  if (!record(value) || (!Array.isArray(value.header) && !record(value.url))) {
    return undefined;
  }
  const url = record(value.url) ? value.url : undefined;
  const body = record(value.body) ? value.body : undefined;
  return {
    header: parameterList(value.header),
    query: parameterList(url?.query),
    variable: parameterList(url?.variable),
    body: body
      ? typeof body.raw === "string"
        ? body.raw
        : JSON.stringify(body, null, 2)
      : undefined,
  };
}
