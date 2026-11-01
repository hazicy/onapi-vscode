import type { EditorRecord } from "@onapi/domain/requests/record";

import { getCollectionChildIds } from "../collections/collection-tree";

/** Keep the selected folder hierarchy, excluding unsupported requests. */
export function getDocumentItems(items: EditorRecord[], root: EditorRecord) {
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
