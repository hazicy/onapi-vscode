import type { Liquid } from "liquidjs";
import { encode, decode } from "js-base64";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import { MD5, SHA1, SHA224, SHA256, SHA384, SHA512 } from "./hashes";

dayjs.extend(utc);
dayjs.extend(advancedFormat);

/** Application-specific filters complement Liquid's standard filters. */
export function registerMockFilters(engine: Liquid): void {
  const filters = {
    md5: MD5,
    sha1: SHA1,
    sha224: SHA224,
    sha256: SHA256,
    sha384: SHA384,
    sha512: SHA512,
    base64: (value: unknown) => encode(String(value)),
    unbase64: (value: unknown) => decode(String(value)),
    number: (value: unknown) => Number(value),
    pad_start: (value: unknown, length: number, text = " ") =>
      String(value).padStart(length, text),
    pad_end: (value: unknown, length: number, text = " ") =>
      String(value).padEnd(length, text),
    format: (
      value: unknown,
      pattern = "YYYY-MM-DD HH:mm:ss",
      offset = "+00:00",
    ) => {
      const date = dayjs(String(value));
      return date.isValid()
        ? date.utc().utcOffset(offset).format(pattern)
        : value;
    },
  };
  for (const [name, filter] of Object.entries(filters)) {
    engine.registerFilter(name, filter);
  }
}
