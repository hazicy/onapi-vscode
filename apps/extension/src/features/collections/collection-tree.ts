import type { ApiDetailsData } from "@onapi/http-model/requests/types/api";

type CollectionItem = Pick<ApiDetailsData, "id" | "parentId" | "kind" | "sort">;

const indexChildren = <T extends CollectionItem>(items: T[]) => {
  const children = new Map<string, T[]>();
  for (const item of items) {
    const siblings = children.get(item.parentId);
    if (siblings) {
      siblings.push(item);
    } else {
      children.set(item.parentId, [item]);
    }
  }
  return children;
};

/** Include the selected item, then its descendants in the original collection order. */
export const getCollectionChildIds = <T extends CollectionItem>(
  items: T[],
  root: T,
): string[] => {
  const children = indexChildren(items);
  const visited = new Set<string>();
  const result: string[] = [];
  const pending = [root];
  while (pending.length > 0) {
    const item = pending.pop()!;
    if (visited.has(item.id)) {
      continue;
    }
    visited.add(item.id);
    result.push(item.id);
    if (item === root || item.kind === "folder") {
      const descendants = children.get(item.id) || [];
      for (let index = descendants.length - 1; index >= 0; index--) {
        pending.push(descendants[index]);
      }
    }
  }
  return result;
};

/** Test runs use sorted APIs in each folder before visiting its sorted subfolders. */
export const getCollectionApis = <T extends CollectionItem>(
  items: T[],
  folderId: string,
): T[] => {
  const children = indexChildren(items);
  const visited = new Set<string>();
  const result: T[] = [];
  const pending = [folderId];
  while (pending.length > 0) {
    const id = pending.pop()!;
    if (visited.has(id)) {
      continue;
    }
    visited.add(id);
    const siblings = (children.get(id) || []).sort((a, b) => a.sort - b.sort);
    for (const item of siblings) {
      if (item.kind === "api") {
        result.push(item);
      }
    }
    for (let index = siblings.length - 1; index >= 0; index--) {
      if (siblings[index].kind === "folder") {
        pending.push(siblings[index].id);
      }
    }
  }
  return result;
};
