import type { Collection } from "../index";
import {
  toPostmanCollection,
  createDefaultHttpConfig,
  fromPostmanCollection,
} from "@onapi/domain";

export function nativeCollection(data: any) {
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
  data: any,
  readPostman: (typeof import("../index"))["readPostman"],
) {
  return readPostman(nativeCollection(data));
}
export function toApp(
  collection: Collection,
  projectId: string,
  writePostman: (typeof import("../index"))["writePostman"],
) {
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
