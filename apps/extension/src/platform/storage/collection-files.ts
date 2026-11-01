import { isDeepStrictEqual } from "node:util";

type CollectionRecord = { id: string; parentId: string; kind: string };
export type CollectionChanges = {
  writes: [string, CollectionRecord][];
  deletes: string[];
};
export type CollectionTransaction = {
  version: 1;
  writes: [string, Record<string, unknown>][];
  deletes: string[];
};
export const COLLECTION_JOURNAL = ".collection-transaction.json";
const segment = (id: string) => encodeURIComponent(id).replace(/\./g, "%2E");

/** Input hierarchies have already been validated by the repository. */
function collectionFiles(rows: CollectionRecord[]) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const directories = new Map<string, string>();
  const directory = (row: CollectionRecord): string => {
    let result = directories.get(row.id);
    if (!result) {
      result =
        row.parentId === "0"
          ? "collections"
          : `${directory(byId.get(row.parentId)!)}/${segment(row.parentId)}`;
      directories.set(row.id, result);
    }
    return result;
  };
  return new Map(
    rows.map((row) => [
      row.kind === "folder"
        ? `${directory(row)}/${segment(row.id)}/collection.json`
        : `${directory(row)}/${row.id === "collection" ? "%63ollection" : segment(row.id)}.json`,
      row,
    ]),
  );
}

/** Moving a folder rewrites its descendants at their new paths, even if their data is unchanged. */
export function planCollectionChanges(
  previous: CollectionRecord[],
  next: CollectionRecord[],
): CollectionChanges {
  const before = collectionFiles(previous);
  const after = collectionFiles(next);
  return {
    writes: [...after].filter(
      ([name, row]) => !isDeepStrictEqual(before.get(name), row),
    ),
    deletes: [...before.keys()].filter((name) => !after.has(name)),
  };
}

/** A damaged or unsupported journal must never be applied to arbitrary paths. */
export function parseCollectionTransaction(
  value: unknown,
): CollectionTransaction {
  const invalid = () => new Error("Invalid collection transaction journal");
  if (!value || typeof value !== "object") {
    throw invalid();
  }
  const journal = value as Record<string, unknown>;
  if (journal.version !== 1) {
    throw new Error(
      `Unsupported collection transaction version: ${journal.version}`,
    );
  }
  if (!Array.isArray(journal.writes) || !Array.isArray(journal.deletes)) {
    throw invalid();
  }
  const paths = new Set<string>();
  const checkPath = (name: unknown) => {
    if (
      typeof name !== "string" ||
      !name.startsWith("collections/") ||
      !name.endsWith(".json") ||
      name.includes("\\") ||
      name.split("/").some((part) => !part || part === "." || part === "..") ||
      paths.has(name)
    ) {
      throw invalid();
    }
    paths.add(name);
  };
  for (const entry of journal.writes) {
    if (
      !Array.isArray(entry) ||
      entry.length !== 2 ||
      !entry[1] ||
      typeof entry[1] !== "object" ||
      Array.isArray(entry[1])
    ) {
      throw invalid();
    }
    checkPath(entry[0]);
  }
  for (const name of journal.deletes) {
    checkPath(name);
  }
  return journal as CollectionTransaction;
}
