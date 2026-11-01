import type { EditorRecord } from "@onapi/domain/requests/record";
import type { HttpProjectConfig, HttpCollectionItem } from "@onapi/domain";

export interface CollectionImportResult {
  name?: string;
  intro?: string;
  apis: HttpCollectionItem[];
  http: HttpProjectConfig;
}

export interface CollectionExportInput {
  apis?: EditorRecord[];
  http?: HttpProjectConfig;
  project?: { name?: string };
  name?: string;
}

import type { Collection } from "../index";
import {
  toPostmanCollection,
  createDefaultHttpConfig,
  fromPostmanCollection,
} from "@onapi/domain";

export function nativeCollection(data: CollectionExportInput) {
  const settings = data.http || createDefaultHttpConfig();
  return toPostmanCollection(data.apis || [], {
    ...settings.collection,
    info: {
      ...settings.collection.info,
      name:
        data.project?.name ||
        data.name ||
        settings.collection.info?.name ||
        "Requests",
    },
  });
}
// External formats are adapted at import/export boundaries; storage and UI share
// the same request records and do not perform these conversions.
export function fromApp(
  data: CollectionExportInput,
  readPostman: (typeof import("../index"))["readPostman"],
) {
  return readPostman(nativeCollection(data));
}
export function toApp(
  collection: Collection,
  projectId: string,
  writePostman: (typeof import("../index"))["writePostman"],
): CollectionImportResult {
  const native = writePostman(collection).data;
  return {
    name: collection.name,
    intro: collection.description || "",
    apis: fromPostmanCollection(native, projectId),
    http: {
      ...createDefaultHttpConfig(),
      collection: Object.fromEntries(
        Object.entries(native).filter(([key]) => key !== "item"),
      ),
      environments: collection.environments.map((environment) => ({
        id: crypto.randomUUID(),
        name: environment.name,
        values: environment.variables.map((variable) => ({
          key: variable.name,
          value: variable.value,
          enabled: true,
        })),
      })),
    },
  };
}
export function toSwaggerImport(
  collection: Collection,
  writePostman: (typeof import("../index"))["writePostman"],
) {
  return toApp(collection, "-1", writePostman);
}
