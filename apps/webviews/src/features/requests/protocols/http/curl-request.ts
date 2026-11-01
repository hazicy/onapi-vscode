import { httpRequestSchema } from "@onapi/domain/requests/record";
import type { ConvertedCurlRequest } from "@/features/curl/types";

export const applyCurlRequest = <
  T extends { request: import("@onapi/domain").HttpRequest },
>(
  record: T,
  converted: ConvertedCurlRequest,
) => ({ ...record, request: httpRequestSchema.parse(converted.request) });
