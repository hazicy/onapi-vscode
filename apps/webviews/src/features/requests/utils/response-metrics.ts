import type { ApiSendingData } from "@onapi/http-model/requests/types/send";
import {
  HTTP_TIME_ARRAY,
  HTTPS_TIME_ARRAY,
} from "@onapi/http-model/requests/constants/response";

type Timings = NonNullable<ApiSendingData["response"]>["formatTimings"];
const timingNames: Record<string, string> = {
  prepare: "Prepare",
  socketInitialization: "Socket Initialization",
  dnsLookup: "DNS Lookup",
  tcpHandshake: "TCP Handshake",
  sslHandshake: "SSL Handshake",
  waiting: "Waiting(TTFB)",
  download: "Download",
  process: "Process",
};

/** Timeline layout is pure data; zero-duration runs never produce NaN widths. */
export function timingSegments(timings?: Timings) {
  if (!timings) {
    return [];
  }
  const total = Object.entries(timings).reduce(
    (sum, [key, value]) =>
      key === "total" ? sum : sum + (value?.duration || 0),
    0,
  );
  const ratio = (duration: number) =>
    total > 0 ? Number((duration / total).toFixed(2)) * 100 : 0;
  const left = ratio(timings.prepare?.duration || 0);
  const right = 100 - ratio(timings.process?.duration || 0);
  let elapsed = 0;
  return ("sslHandshake" in timings ? HTTPS_TIME_ARRAY : HTTP_TIME_ARRAY).map(
    (key) => {
      const duration = timings[key as keyof Timings]?.duration || 0;
      const width = ratio(duration);
      const segment = {
        key,
        name: timingNames[key],
        width,
        lineLeftSize: left,
        lineRightSize: right,
        marginLeft:
          key === "prepare"
            ? 0
            : key === "process"
              ? 100 - width
              : total > 0
                ? (elapsed / total) * 100
                : 0,
      };
      elapsed += duration;
      return segment;
    },
  );
}
