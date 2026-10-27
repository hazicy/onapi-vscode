import type { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import { getCollectionChildIds } from "../collections/collection-tree";

/** Keep the selected folder hierarchy, excluding unsupported requests. */
export function getDocumentItems(
  items: ApiDetailsData[],
  root: ApiDetailsData,
) {
  const active = items;
  if (!active.some((item) => item.id === root.id)) {
    return [];
  }
  const ids = new Set(getCollectionChildIds(active, root));
  return active.filter(
    (item) =>
      ids.has(item.id) && ["folder", "api", "graphql"].includes(item.kind),
  );
}
