import { parse as parseUrl } from "postman-url-encoder/parser/index.js";
import type {
  CollectionDefinition,
  ItemDefinition,
  ItemGroupDefinition,
  VariableScopeDefinition,
  VariableDefinition,
  RequestDefinition,
  RequestBodyDefinition,
  QueryParamDefinition,
  FormParamDefinition,
  UrlDefinition,
} from "postman-collection";

/** Serializable SDK body fields used by storage, editors and execution. */
export type HttpRequestBody = Omit<
  RequestBodyDefinition,
  "urlencoded" | "formdata" | "file"
> & {
  urlencoded?: QueryParamDefinition[];
  formdata?: FormParamDefinition[];
  file?: { src: string };
  graphql?: RequestBodyDefinition["graphql"];
  options?: { raw?: { language?: string } };
};
export type HttpRequest = Omit<RequestDefinition, "body"> & {
  body?: HttpRequestBody;
};

/** Editor and execution state never belongs to a saved request definition. */
export function requestDefinition<T extends Record<string, any>>(value: T): T {
  const copy = { ...value };
  for (const key of [
    "is_create",
    "is_changed",
    "save_loading",
    "has_changed",
    "is_conflicted",
  ]) {
    delete copy[key];
  }
  return copy;
}

export type HttpCollectionItem = Omit<ItemDefinition, "request"> &
  Omit<ItemGroupDefinition, "item"> & {
    request?: HttpRequest;
    variable?: VariableDefinition[];
    id: string;
    parentId: string;
    kind: "api" | "sse" | "graphql" | "folder";
    name: string;
    sort?: number;
    project_id?: string;
  };
export type HttpRequestItem = HttpCollectionItem & {
  request: HttpRequest;
};
export type PostmanCollection = CollectionDefinition & {
  info?: NonNullable<CollectionDefinition["info"]> & { schema?: string };
};
export type EnvironmentScope = VariableScopeDefinition & {
  id: string;
  name: string;
  isLocal?: boolean;
  sort?: number;
};
export interface SerializedCookie {
  key: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  secure?: boolean;
  httpOnly?: boolean;
  [property: string]: unknown;
}
export interface SerializedCookieJar {
  cookies?: SerializedCookie[];
  [property: string]: unknown;
}

export type HttpProjectConfig = {
  collection: Omit<PostmanCollection, "item">;
  environments: EnvironmentScope[];
  activeEnvironment?: string;
  options: Record<string, any> & {
    globals: VariableScopeDefinition;
    requester?: Record<string, unknown> & { cookieJar?: SerializedCookieJar };
  };
};
export const HTTP_TYPES = new Set(["api", "sse", "graphql", "folder"]);
export const isHttpCollectionItem = (item: { kind?: string }) =>
  HTTP_TYPES.has(item.kind || "");
export function requestUrl(item: any): string {
  const url = item.request?.url;
  if (typeof url === "string") {
    return url;
  }
  if (!url) {
    return "";
  }
  if (url.raw) {
    return url.raw;
  }
  const host = Array.isArray(url.host) ? url.host.join(".") : url.host || "";
  const path = Array.isArray(url.path) ? url.path.join("/") : url.path || "";
  const query = (url.query || [])
    .filter((entry: any) => !entry.disabled)
    .map(
      (entry: any) =>
        `${entry.key}${entry.value === null ? "" : `=${entry.value ?? ""}`}`,
    )
    .join("&");
  return `${url.protocol ? `${url.protocol.replace(/:$/, "")}://` : ""}${host}${url.port ? `:${url.port}` : ""}${path ? `/${path}` : ""}${query ? `?${query}` : ""}${url.hash ? `#${url.hash}` : ""}`;
}
export const requestMethod = (item: any): string =>
  item.request?.method || "GET";
export function createDefaultHttpConfig(): HttpProjectConfig {
  return {
    collection: {
      info: {
        name: "Requests",
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
    },
    environments: [
      {
        id: "default",
        name: "Default",
        values: [{ key: "baseUrl", value: "https://httpbin.org" }],
      },
    ],
    activeEnvironment: "default",
    options: {
      globals: { values: [] },
      stopOnError: true,
      timeout: { request: 30000, script: 30000 },
      requester: { strictSSL: false, followRedirects: true },
    },
  };
}

// Construct the external SDK format at execution and export boundaries.
export function toPostmanCollection(
  rows: any[],
  definition: PostmanCollection,
  selected?: Set<string>,
): PostmanCollection {
  const byId = new Map(
    rows
      .filter(isHttpCollectionItem)
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((item) => [item.id, item]),
  );
  const needed = selected ? new Set(selected) : new Set(byId.keys());
  for (const id of [...needed]) {
    let item = byId.get(id);
    const seen = new Set();
    while (item && !seen.has(item.id)) {
      seen.add(item.id);
      needed.add(item.id);
      item = byId.get(item.parentId);
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function append(item: any): any {
    if (visiting.has(item.id)) {
      throw new Error("Circular collection hierarchy");
    }
    visiting.add(item.id);
    visited.add(item.id);
    const native: any = { id: item.id, name: item.name };
    for (const key of [
      "description",
      "event",
      "variable",
      "auth",
      "protocolProfileBehavior",
      "response",
    ]) {
      if (item[key] !== undefined) {
        native[key] = structuredClone(item[key]);
      }
    }
    if (item.kind === "folder") {
      native.item = rows
        .filter(
          (child) =>
            child.parentId === item.id &&
            needed.has(child.id) &&
            isHttpCollectionItem(child),
        )
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
        .map(append);
    } else {
      native.request = structuredClone(item.request);
    }
    visiting.delete(item.id);
    return native;
  }
  const item = rows
    .filter(
      (row) =>
        needed.has(row.id) &&
        isHttpCollectionItem(row) &&
        !byId.has(row.parentId),
    )
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map(append);
  if ([...needed].some((id) => byId.has(id) && !visited.has(id))) {
    throw new Error("Unreachable collection hierarchy");
  }
  return { ...structuredClone(definition), item };
}

export function fromPostmanCollection(
  collection: CollectionDefinition,
  projectId = "-1",
): HttpCollectionItem[] {
  const result: HttpCollectionItem[] = [];
  function append(items: any[], parent = "0") {
    for (const [sort, item] of items.entries()) {
      const id = item.id || crypto.randomUUID();
      const { item: children, ...definition } = item;
      const url = definition.request?.url;
      if (url && typeof url === "object" && url.raw && !url.host) {
        definition.request = {
          ...definition.request,
          url: { ...editedUrl(url.raw, url), ...url },
        };
      }
      result.push({
        ...structuredClone(definition),
        id,
        parentId: parent,
        project_id: projectId,
        kind: children ? "folder" : "api",
        name: item.name || "Request",
        sort,
      });
      if (children) {
        append(children, id);
      }
    }
  }
  append(collection.item || []);
  return result;
}

export function urlWithQuery(url: any, query: any[]) {
  const raw =
    typeof url === "string"
      ? url
      : url?.raw || requestUrl({ request: { url } });
  const [base, hash] = raw.split("#", 2);
  const search = query
    .filter((row) => row.key && !row.disabled)
    .map(
      (row) =>
        `${encodeURIComponent(row.key)}${row.value === null ? "" : `=${encodeURIComponent(row.value ?? "")}`}`,
    )
    .join("&");
  return {
    ...editedUrl(
      base.split("?")[0] +
        (search ? `?${search}` : "") +
        (hash ? `#${hash}` : ""),
      url,
    ),
    query,
  };
}
export function editedUrl(
  raw: string,
  previous: UrlDefinition = {},
): UrlDefinition & { raw: string; query: QueryParamDefinition[] } {
  // SDK URL objects execute their structured fields; `raw` alone is display data.
  const parsed = parseUrl(raw);
  const query = (parsed.query || []).map((pair: string) => {
    const index = pair.indexOf("=");
    return {
      key: index < 0 ? pair : pair.slice(0, index),
      value: index < 0 ? null : pair.slice(index + 1),
    };
  });
  const keys = [
    ...new Set<string>(
      (parsed.path || [])
        .filter((segment: string) => segment.startsWith(":"))
        .map((segment: string) => segment.slice(1).split(".")[0])
        .filter(Boolean),
    ),
  ];
  const variable = keys.map(
    (key) =>
      previous?.variable?.find((entry: any) => entry.key === key) || { key },
  );
  const { auth, ...url } = parsed;
  return {
    ...url,
    ...(auth ? { auth: { user: auth[0], password: auth[1] } } : {}),
    raw,
    query,
    variable,
  };
}

export function responseText(response: any, encoding = "utf-8"): string {
  if (typeof response?.body === "string") {
    return response.body;
  }
  if (response?.stream?.data) {
    return new TextDecoder(encoding).decode(
      new Uint8Array(response.stream.data),
    );
  }
  return "";
}
export function responseLanguage(response: any): string {
  const type =
    response?.header?.find(
      (row: any) => row.key?.toLowerCase() === "content-type",
    )?.value || "";
  return type.includes("json")
    ? "json"
    : type.includes("html")
      ? "html"
      : type.includes("xml")
        ? "xml"
        : type.includes("javascript")
          ? "javascript"
          : "plain";
}
