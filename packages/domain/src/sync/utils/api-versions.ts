import { isNumber } from "lodash";

type VersionedApi = {
  id: string;
  kind: string;
  parentId: string;
  version?: number;
};

const conflictTypes = new Set([
  "api",
  "sse",
  "websocket",
  "socketio",
  "folder",
  "graphql",
]);

export const findApiConflicts = <T extends VersionedApi>(
  selected: T[],
  cloud: Array<{ id: string; version: number }>,
  recordedVersions: Record<string, unknown>,
): T[] => {
  // Preserve "any newer cloud row" semantics even if a response repeats an ID.
  const cloudVersions = new Map<string, number>();
  for (const item of cloud) {
    const version = Number(item.version);
    if (version > (cloudVersions.get(item.id) ?? -Infinity)) {
      cloudVersions.set(item.id, version);
    }
  }
  return selected
    .filter((item) => {
      const recorded = recordedVersions[item.id];
      const baseline = isNumber(recorded) ? recorded : (item.version ?? 0);
      const cloudVersion = cloudVersions.get(item.id);
      return (
        conflictTypes.has(item.kind) &&
        cloudVersion !== undefined &&
        cloudVersion > baseline
      );
    })
    .map((item) => ({ ...item, parentId: "0" }))
    .sort((a, b) => Number(b.kind === "folder") - Number(a.kind === "folder"));
};

/** Mutate the caller's upload snapshot; ignore response IDs that are no longer local. */
export const applyApiVersions = <T extends { id: string; version: number }>(
  local: T[],
  uploaded: Array<{ id: string; version?: unknown }>,
): boolean => {
  const localById = new Map<string, T>();
  for (const item of local) {
    if (!localById.has(item.id)) {
      localById.set(item.id, item);
    }
  }
  let matched = false;
  for (const item of uploaded) {
    const saved = localById.get(item.id);
    if (saved && isNumber(item.version)) {
      saved.version = item.version;
      matched = true;
    }
  }
  return matched;
};
