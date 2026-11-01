import {
  fromApp,
  toApp,
  toSwaggerImport,
  nativeCollection,
} from "@onapi/api-converter/adapters/converter-adapter";
import { fromPostmanCollection, createDefaultHttpConfig } from "@onapi/domain";
import type {
  CollectionExportInput,
  CollectionImportResult,
} from "./adapters/converter-adapter";
import type { PostmanCollection } from "@onapi/domain";
import type { Result, Warning } from "@onapi/api-converter";

export type ConversionResult<T> =
  | { status: "success"; message: string; data: T; warnings: Warning[] }
  | { status: "error"; message: string; warnings: Warning[] };

const failure = (
  error: unknown,
): Extract<ConversionResult<never>, { status: "error" }> => ({
  status: "error",
  message: String(error),
  warnings: [],
});

function isPostmanCollection(value: unknown): value is PostmanCollection {
  if (
    !value ||
    typeof value !== "object" ||
    !("info" in value) ||
    !("item" in value)
  ) {
    return false;
  }
  const info = value.info;
  return (
    !!info &&
    typeof info === "object" &&
    "name" in info &&
    typeof info.name === "string" &&
    info.name.length > 0 &&
    Array.isArray(value.item)
  );
}
const loadConverters = (() => {
  let pending: Promise<typeof import("./index")> | undefined;
  return () => (pending ??= import("./index"));
})();
async function convert<T>(
  run: (converters: Awaited<ReturnType<typeof loadConverters>>) => Result<T>,
): Promise<ConversionResult<T>> {
  try {
    const result = run(await loadConverters());
    return { status: "success" as const, message: "", ...result };
  } catch (error) {
    return failure(error);
  }
}
export const exportMethod = {
  toOpenApi: (data: CollectionExportInput, version: "2.0" | "3.0") =>
    convert(({ writeOpenApi, readPostman }) => {
      const source = fromApp(data, readPostman);
      const result = writeOpenApi(source.data, version);
      return {
        data: result.data,
        warnings: [...source.warnings, ...result.warnings],
      };
    }),
  toPostman: async (
    data: CollectionExportInput,
  ): Promise<ConversionResult<PostmanCollection>> => {
    try {
      return {
        status: "success" as const,
        message: "",
        data: nativeCollection(data),
        warnings: [],
      };
    } catch (error) {
      return failure(error);
    }
  },
};
export const importMethod = {
  fromPostman: async (
    data: unknown,
    projectId: string,
  ): Promise<ConversionResult<CollectionImportResult>> => {
    try {
      if (!isPostmanCollection(data)) {
        throw new Error("Invalid Postman collection");
      }
      return {
        status: "success" as const,
        message: "",
        data: {
          apis: fromPostmanCollection(data, projectId),
          http: {
            ...createDefaultHttpConfig(),
            collection: Object.fromEntries(
              Object.entries(data).filter(([key]) => key !== "item"),
            ),
          },
        },
        warnings: [],
      };
    } catch (error) {
      return failure(error);
    }
  },
  fromThunder: (data: unknown, projectId: string) =>
    convert(({ readThunder, writePostman }) => {
      const result = readThunder(data);
      return {
        data: toApp(result.data, projectId, writePostman),
        warnings: result.warnings,
      };
    }),
  fromOpenApi: (
    data: unknown,
    options: { basePath: boolean; host: boolean } | null,
  ) =>
    convert(({ readOpenApi, writePostman }) => {
      const result = readOpenApi(data, options || undefined);
      return {
        data: toSwaggerImport(result.data, writePostman),
        warnings: result.warnings,
      };
    }),
};
