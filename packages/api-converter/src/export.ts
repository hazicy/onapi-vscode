import {
  fromApp,
  toApp,
  toSwaggerImport,
  nativeCollection,
} from "@onapi/api-converter/adapters/converter-adapter";
import { fromPostmanCollection, createDefaultHttpConfig } from "@onapi/domain";
import type { Result, Warning } from "@onapi/api-converter";

export const throwResult = (
  status: "error" | "success",
  message: string,
  data: any = "",
) => ({ status, message, data, warnings: [] as Warning[] });
const loadConverters = (() => {
  let pending: Promise<typeof import("./index")> | undefined;
  return () => (pending ??= import("./index"));
})();
async function convert<T>(
  run: (converters: Awaited<ReturnType<typeof loadConverters>>) => Result<T>,
) {
  try {
    const result = run(await loadConverters());
    return { status: "success" as const, message: "", ...result };
  } catch (error) {
    return throwResult("error", String(error));
  }
}
export const exportMethod = {
  apiToSwagger: (
    data: any,
    version: string,
    _language?: "en" | "zh-cn" | "ja" | "zh-hant" | "id",
  ) =>
    convert(({ writeOpenApi, readPostman }) => {
      const source = fromApp(data, readPostman);
      const result = writeOpenApi(source.data, version as "2.0" | "3.0");
      return {
        data: result.data,
        warnings: [...source.warnings, ...result.warnings],
      };
    }),
  apiToPostman: async (data: any) => {
    try {
      return {
        status: "success" as const,
        message: "",
        data: nativeCollection(data),
        warnings: [],
      };
    } catch (error) {
      return throwResult("error", String(error));
    }
  },
};
export const importMethod = {
  postmanToApipost: async (data: any, projectId: string) => {
    try {
      if (!data?.info?.name || !Array.isArray(data.item)) {
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
      return throwResult("error", String(error));
    }
  },
  thunderToApipost: (data: any, projectId: string) =>
    convert(({ readThunder, writePostman }) => {
      const result = readThunder(data);
      return {
        data: toApp(result.data, projectId, writePostman),
        warnings: result.warnings,
      };
    }),
  swaggerToApipost: (
    data: any,
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
