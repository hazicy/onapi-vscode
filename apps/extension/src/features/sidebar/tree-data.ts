import type { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { isHttpCollectionItem, requestUrl, requestMethod } from "@onapi/domain";
import type { TestingReportList } from "@onapi/domain/testing/types/res/index";
import type { RequestHistoryEntry } from "../requests/request-history";

export type SidebarTreeSection = "requests" | "tests" | "history";
export type SidebarTreeNode =
  | { kind: "request"; data: ApiDetailsData }
  | { kind: "testFolder"; data: ApiDetailsData }
  | { kind: "reports" }
  | { kind: "report"; data: TestingReportList }
  | { kind: "day"; day: string }
  | { kind: "history"; data: RequestHistoryEntry }
  | { kind: "empty"; label: string; id: string };

export function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Count descendants, excluding containers, without looping on malformed ancestry. */
export function countFolderRequests(
  all: ApiDetailsData[],
  folderId: string,
): number {
  const children = new Map<string, ApiDetailsData[]>();
  for (const item of all) {
    const parent = String(item.parentId);
    const siblings = children.get(parent) || [];
    siblings.push(item);
    children.set(parent, siblings);
  }
  const pending = [String(folderId)];
  const visited = new Set(pending);
  let count = 0;
  while (pending.length) {
    for (const item of children.get(pending.pop()!) || []) {
      const id = String(item.id);
      if (visited.has(id)) {
        continue;
      }
      visited.add(id);
      if (!["folder", "socket", "sample_group"].includes(item.kind)) {
        count++;
      }
      pending.push(id);
    }
  }
  return count;
}

/** Preserve matching requests and their ancestors while keeping root ordering stable. */
export function requestChildren(
  all: ApiDetailsData[],
  parent?: ApiDetailsData,
  filter = "",
  foldersOnly = false,
): ApiDetailsData[] {
  const byId = new Map(all.map((item) => [String(item.id), item]));
  const visible = new Set<string>();
  if (filter) {
    for (const item of all) {
      if (
        !`${item.name} ${isHttpCollectionItem(item) ? requestUrl(item) : item.url || ""} ${isHttpCollectionItem(item) ? requestMethod(item) : item.method || ""}`
          .toLowerCase()
          .includes(filter)
      ) {
        continue;
      }
      let current: ApiDetailsData | undefined = item;
      const visited = new Set<string>();
      while (current && !visited.has(String(current.id))) {
        const id = String(current.id);
        visited.add(id);
        visible.add(id);
        current = byId.get(String(current.parentId));
      }
    }
  }
  return all
    .filter((item) => {
      if (foldersOnly && item.kind !== "folder") {
        return false;
      }
      if (filter && !visible.has(String(item.id))) {
        return false;
      }
      return parent
        ? String(item.parentId) === String(parent.id)
        : !item.parentId ||
            String(item.parentId) === "0" ||
            !byId.has(String(item.parentId));
    })
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
}
