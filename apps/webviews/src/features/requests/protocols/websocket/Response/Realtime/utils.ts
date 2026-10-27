import { bufferToRaw } from "@onapi/domain/utils/response-tools";

/** Use the same decoded content in the message list, detail view and search. */
export function getSocketContent(item: any): string {
  const message = item?.message;
  const content = ["message", "send"].includes(item?.action)
    ? message?.data
    : (message?.message ?? message);
  try {
    if (content?.type === "Buffer" && Array.isArray(content.data)) {
      return bufferToRaw(content.data, {}).raw;
    }
    if (ArrayBuffer.isView(content)) {
      return bufferToRaw(content, {}).raw;
    }
    return getSendStr(content);
  } catch {
    return "";
  }
}

export const handleSocketResponse = (
  response: any[],
  filterValue?: string,
  filterType?: string,
) => {
  const query = filterValue?.trim() || "";
  return (response || []).flatMap((item, index) => {
    if (
      !["connect", "disconnect", "error", "message", "send"].includes(
        item?.action,
      )
    ) {
      return [];
    }
    if (filterType && filterType !== "all" && item.action !== filterType) {
      return [];
    }
    if (query && !getSocketContent(item).includes(query)) {
      return [];
    }
    // Filtering must not change row identity or lose the selected highlight.
    return [{ ...item, id: item.id ?? String(index) }];
  });
};

export const getSendStr = (data: any): string => {
  if (typeof data === "string") {
    return data;
  }
  if (data === null || data === undefined) {
    return "";
  }
  return typeof data === "object" ? JSON.stringify(data) : String(data);
};
