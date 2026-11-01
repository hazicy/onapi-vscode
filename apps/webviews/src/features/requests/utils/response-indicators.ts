import type { SerializedResponse } from "@onapi/contracts";
import type { ApiSendingData } from "@onapi/domain/requests/types/send";
import type { RequestDefinition } from "postman-collection";
import { sdkResponseView } from "./executionView";

export type IndicatorResponse = ApiSendingData["response"] | SerializedResponse;
export type IndicatorRequest = ApiSendingData["request"] | RequestDefinition;

/** Normalize runtime responses and imported examples before rendering metrics. */
export function responseIndicators(
  sourceResponse?: IndicatorResponse,
  sourceRequest?: IndicatorRequest,
) {
  const native = sdkResponseView(sourceResponse);
  const response =
    sourceResponse && "mime_type" in sourceResponse
      ? sourceResponse
      : undefined;
  const request =
    sourceRequest && "headers" in sourceRequest ? sourceRequest : undefined;
  const responseProxy = response?.proxy;
  const requestProxy = request?.proxy;
  return {
    code: sourceResponse?.code,
    size:
      native?.responseSize ??
      response?.stream?.data?.byteLength ??
      response?.response_size ??
      0,
    time: native?.responseTime ?? response?.response_time,
    timings: response?.timings,
    formatTimings: response?.formatTimings,
    formatSize: response?.formatSize,
    network: response?.network,
    hasFormattedTimings:
      response?.formatTimings !== undefined && response.formatTimings !== null,
    proxy:
      responseProxy?.href ||
      (requestProxy?.host && requestProxy.port
        ? `${requestProxy.host}:${requestProxy.port}`
        : undefined),
  };
}
