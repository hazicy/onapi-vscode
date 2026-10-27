// Small, dependency-free operations used while constructing request panels.
// Adapted from apipost-tools (MIT), without its formatters and vendor dependencies.
export function isJson(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false;
  }
}

export function getUrlQueryArray(url: string) {
  if (typeof url !== "string") {
    return [];
  }
  const index = url.indexOf("?");
  if (index === -1) {
    return [];
  }
  return url
    .slice(index + 1)
    .split("&")
    .map((part) => {
      const [key, ...value] = part.split("=");
      return { key, value: value.join("=") };
    });
}

export function array2Tree(items: any[], idName = "id", pidName = "pid") {
  if (
    !Array.isArray(items) ||
    items.some((item) => item === null || item === undefined)
  ) {
    return [];
  }
  const result: any[] = [];
  const nodes = new Map<any, any>();
  for (const item of items) {
    const id = item[idName];
    const pid = item[pidName];
    if (!id) {
      continue;
    }
    // Numeric and string identifiers represent the same stored node.
    const key = String(id);
    const node = { ...item, children: nodes.get(key)?.children || [] };
    nodes.set(key, node);
    if (
      pid === 0 ||
      pid === "0" ||
      pid === "" ||
      pid === false ||
      pid === null ||
      pid === undefined
    ) {
      result.push(node);
    } else {
      const parentKey = String(pid);
      if (!nodes.has(parentKey)) {
        nodes.set(parentKey, { children: [] });
      }
      nodes.get(parentKey).children.push(node);
    }
  }
  return result;
}

export function completionHttpProtocol(data: any) {
  const complete = (url: string) =>
    /^https?:\/\//i.test(url) ? url : `http://${url}`;
  if (typeof data === "string") {
    return complete(data);
  }
  if (
    data &&
    Object.prototype.hasOwnProperty.call(data, "url") &&
    typeof data.url === "string"
  ) {
    data.url = complete(data.url);
  }
  return data;
}

let sequence = 0;

// Same hexadecimal/binary ID layout as the existing generator. Keep its seed,
// timestamp and sequence rules so stored IDs remain opaque strings to callers.
export function snowflakeId(seed = "", base = 16): string {
  if (!seed) {
    const browser = globalThis as typeof globalThis & {
      window?: {
        navigator: { userAgent: string; language: string };
        screen: { colorDepth: number; width: number; height: number };
      };
    };
    const browserWindow = browser.window;
    if (typeof process === "object" && String(process) === "[object process]") {
      seed = String(process.pid);
    } else if (browserWindow?.navigator?.userAgent) {
      seed =
        browserWindow.navigator.userAgent +
        browserWindow.navigator.language +
        browserWindow.screen.colorDepth +
        browserWindow.screen.width +
        browserWindow.screen.height;
    } else {
      const alphabet =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      for (let i = 0; i < 32; i++) {
        seed += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }
  seed = String(seed);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
  }
  const machine = (hash >>> 0).toString(2).padEnd(9, "0").slice(0, 9);
  let currentSequence = sequence++;
  if (currentSequence > 4095) {
    currentSequence %= 4095;
  }
  const timestamp = ((Date.now() - 1671537188000) >>> 0)
    .toString(2)
    .padStart(41, "0");
  const binary =
    "0" +
    timestamp +
    "1" +
    machine +
    currentSequence.toString(2).padStart(12, "0");
  if (base === 2) {
    return binary;
  }
  return binary
    .match(/.{4}/g)!
    .map((part) => parseInt(part, 2).toString(16))
    .join("")
    .replace(/^0+/, "");
}
