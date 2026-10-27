import {
  type Auth,
  type Collection,
  type Document,
  type Item,
  type Parameter,
  type Result,
  type Warning,
  emptyRequest,
  object,
  text,
  warn,
} from "../model";

const methods = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace",
]);
const mime = (mode: string) =>
  ({
    json: "application/json",
    xml: "application/xml",
    "form-data": "multipart/form-data",
    urlencoded: "application/x-www-form-urlencoded",
    binary: "application/octet-stream",
    html: "text/html",
  })[mode] || "text/plain";
const mode = (type: string) =>
  type.includes("json")
    ? "json"
    : type.includes("xml")
      ? "xml"
      : type.includes("multipart")
        ? "form-data"
        : type.includes("x-www-form-urlencoded")
          ? "urlencoded"
          : type.includes("octet-stream")
            ? "binary"
            : "plain";

export function readOpenApi(
  input: unknown,
  options = { basePath: true, host: true },
): Result<Collection> {
  const doc = object(input, "OpenAPI document");
  const v2 = doc.swagger === "2.0";
  if (!v2 && !/^3\.[01]\./.test(doc.openapi || "")) {
    throw new Error("Supported versions: Swagger 2.0, OpenAPI 3.0 and 3.1");
  }
  object(doc.paths, "OpenAPI paths");
  const warnings: Warning[] = [];
  const resolve = (value: any, seen = new Set<string>()): any => {
    if (!value?.$ref) {
      return value || {};
    }
    const ref = value.$ref;
    if (!ref.startsWith("#/")) {
      throw new Error(
        `External reference must be bundled before importing: ${ref}`,
      );
    }
    if (seen.has(ref)) {
      throw new Error(`Cyclic non-schema reference: ${ref}`);
    }
    seen.add(ref);
    const target = ref
      .slice(2)
      .split("/")
      .reduce(
        (node: any, key: string) =>
          node?.[key.replace(/~1/g, "/").replace(/~0/g, "~")],
        doc,
      );
    if (!target) {
      throw new Error(`Unresolved reference: ${ref}`);
    }
    return resolve(target, seen);
  };
  // Embed the referenced definitions without dereferencing schemas (including cycles).
  const schema = (value: Document = {}): Document => {
    const result = JSON.parse(JSON.stringify(value));
    const definitions: Document = {};
    const visit = (node: any) => {
      if (!node || typeof node !== "object") {
        return;
      }
      if (node.$ref) {
        const ref = node.$ref;
        if (!ref.startsWith("#/")) {
          throw new Error(
            `External schema reference must be bundled before importing: ${ref}`,
          );
        }
        const key = ref.slice(2);
        node.$ref = `#/$defs/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`;
        if (!(key in definitions)) {
          const target = ref
            .slice(2)
            .split("/")
            .reduce(
              (n: any, k: string) =>
                n?.[k.replace(/~1/g, "/").replace(/~0/g, "~")],
              doc,
            );
          if (!target) {
            throw new Error(`Unresolved schema reference: ${ref}`);
          }
          definitions[key] = JSON.parse(JSON.stringify(target));
          visit(definitions[key]);
        }
      }
      Object.values(node).forEach(visit);
    };
    visit(result);
    if (Object.keys(definitions).length) {
      result.$defs = { ...result.$defs, ...definitions };
    }
    return result;
  };
  const servers = v2
    ? [
        {
          url: `${doc.host ? `${doc.schemes?.[0] || "https"}://${doc.host}` : ""}${doc.basePath || ""}`,
        },
      ]
    : doc.servers || [];
  const serverUrl = (server: any) =>
    (server?.url || "").replace(/\{([^}]+)\}/g, (_: string, name: string) =>
      text(server.variables?.[name]?.default ?? `{{${name}}}`),
    );
  function security(requirements: any): Auth | undefined {
    if (!requirements) {
      return undefined;
    }
    if (!requirements.length) {
      return { type: "noauth" };
    }
    const names = Object.keys(requirements[0]);
    if (requirements.length > 1 || names.length > 1) {
      warn(
        warnings,
        "security",
        "security",
        "Only the first security scheme is represented in request authentication",
      );
    }
    const name = names[0];
    if (!name) {
      return { type: "noauth" };
    }
    const s = resolve(
      (v2 ? doc.securityDefinitions : doc.components?.securitySchemes)?.[name],
    );
    if (s.type === "basic" || (s.type === "http" && s.scheme === "basic")) {
      return { type: "basic", values: { username: "", password: "" } };
    }
    if (s.type === "http" && s.scheme === "bearer") {
      return { type: "bearer", values: { token: "" } };
    }
    if (s.type === "apiKey") {
      return { type: "apikey", values: { key: s.name, value: "", in: s.in } };
    }
    warn(
      warnings,
      "auth",
      name,
      `Security scheme ${s.type} requires manual configuration`,
    );
    return undefined;
  }
  const items: Item[] = [];
  const folders = new Map<string, Item>();
  for (const [path, rawPath] of Object.entries(doc.paths)) {
    const pathItem = resolve(rawPath);
    for (const [method, rawOperation] of Object.entries(pathItem)) {
      if (!methods.has(method)) {
        continue;
      }
      const op = resolve(rawOperation);
      const selectedServer =
        op.servers?.[0] || pathItem.servers?.[0] || servers[0];
      const server = serverUrl(selectedServer);
      let prefix = server;
      const match = server.match(/^(https?:\/\/[^/]+)(.*)$/);
      if (match) {
        prefix =
          (options.host ? match[1] : "") + (options.basePath ? match[2] : "");
      } else if (!options.basePath) {
        prefix = "";
      }
      const r = emptyRequest(prefix.replace(/\/$/, "") + path, method);
      r.tags = op.tags;
      r.auth = security(op.security ?? doc.security);
      const params = new Map<string, any>();
      for (const p of [
        ...(pathItem.parameters || []),
        ...(op.parameters || []),
      ]) {
        const resolved = resolve(p);
        params.set(`${resolved.in}:${resolved.name}`, resolved);
      }
      for (const p of params.values()) {
        const s = schema(
          p.schema || {
            type: p.type || "string",
            ...(p.items ? { items: p.items } : {}),
          },
        );
        const parameter: Parameter = {
          name: p.name,
          value: text(p.example ?? s.example ?? s.default),
          description: p.description,
          required: p.required || p.in === "path",
          schema: s,
        };
        if (p.in === "query") {
          r.query.push(parameter);
        } else if (p.in === "header") {
          r.headers.push(parameter);
        } else if (p.in === "path") {
          r.path.push(parameter);
        } else if (p.in === "cookie") {
          r.cookies.push(parameter);
        } else if (p.in === "body") {
          r.body = {
            mode: mode(
              (op.consumes || doc.consumes || ["application/json"])[0],
            ),
            schema: s,
            raw: text(p.example ?? s.example),
            contentType: (op.consumes ||
              doc.consumes || ["application/json"])[0],
          };
        } else if (p.in === "formData") {
          r.body ??= {
            mode: (op.consumes || doc.consumes || []).includes(
              "multipart/form-data",
            )
              ? "form-data"
              : "urlencoded",
            parameters: [],
          };
          r.body.parameters!.push({ ...parameter, file: p.type === "file" });
        }
      }
      if (op.requestBody) {
        const b = resolve(op.requestBody);
        const entries = Object.entries(b.content || {});
        if (entries.length > 1) {
          warn(
            warnings,
            "media-types",
            path,
            "Only the first request body media type is imported",
          );
        }
        if (entries.length) {
          const [type, media] = entries[0] as [string, any];
          const s = schema(media.schema);
          r.body = {
            mode: mode(type),
            schema: s,
            contentType: type,
            raw: text(
              media.example ??
                Object.values(media.examples || {}).map(
                  (e: any) => resolve(e).value,
                )[0] ??
                s.example,
            ),
          };
          if (["form-data", "urlencoded"].includes(r.body.mode)) {
            r.body.parameters = Object.entries(s.properties || {}).map(
              ([name, p]: [string, any]) => ({
                name,
                value: text(p.example ?? p.default),
                schema: p,
                required: s.required?.includes(name),
                file: p.format === "binary",
              }),
            );
          }
        }
      }
      for (const [status, raw] of Object.entries(op.responses || {})) {
        const response = resolve(raw);
        const content = Object.entries(response.content || {}) as [
          string,
          any,
        ][];
        if (content.length > 1) {
          warn(
            warnings,
            "media-types",
            path,
            "Only the first response media type is imported",
          );
        }
        const [type, media] = content[0] || [
          (op.produces || doc.produces || ["application/json"])[0],
          {
            schema: response.schema,
            example: Object.values(response.examples || {})[0],
          },
        ];
        const s = schema(media.schema);
        const examples = media.examples
          ? Object.entries(media.examples).map(([name, value]) => ({
              name,
              value: resolve(value).value,
            }))
          : [
              {
                name: response.description || status,
                value: media.example ?? s.example,
              },
            ];
        for (const example of examples) {
          r.responses.push({
            name: example.name,
            status,
            body: text(example.value),
            contentType: type,
            schema: s,
            headers: Object.entries(response.headers || {}).map(
              ([name, value]: [string, any]) => ({
                name,
                value: text(value.example),
                schema: schema(
                  value.schema || { type: value.type || "string" },
                ),
              }),
            ),
          });
        }
      }
      const item: Item = {
        name: op.summary || op.operationId || `${method.toUpperCase()} ${path}`,
        description: op.description,
        request: r,
      };
      const tag = op.tags?.[0];
      if (tag) {
        if (!folders.has(tag)) {
          const folder = { name: tag, children: [] as Item[] };
          folders.set(tag, folder);
          items.push(folder);
        }
        folders.get(tag)!.children!.push(item);
      } else {
        items.push(item);
      }
      if (op.callbacks) {
        warn(
          warnings,
          "callbacks",
          path,
          "Callbacks were not converted into requests",
        );
      }
    }
  }
  return {
    data: {
      name: doc.info?.title || "OpenAPI",
      description: doc.info?.description,
      items,
      variables: [],
      environments: servers.map((s: any, i: number) => ({
        name: s.description || `Server ${i + 1}`,
        url: serverUrl(s),
        variables: Object.entries(s.variables || {}).map(
          ([name, value]: [string, any]) => ({
            name,
            value: text(value.default),
            description: value.description,
          }),
        ),
      })),
    },
    warnings,
  };
}

export function writeOpenApi(
  collection: Collection,
  version: "2.0" | "3.0" = "3.0",
): Result<Document> {
  if (version !== "2.0" && version !== "3.0") {
    throw new Error(`Unsupported OpenAPI export version: ${version}`);
  }
  const v2 = version === "2.0";
  const warnings: Warning[] = [];
  const paths: Document = {};
  const securitySchemes: Document = {};
  const definitions: Document = {};
  // Hoist per-body $defs so local schema references stay valid in the document.
  const schema = (source: any): Document => {
    const result = JSON.parse(JSON.stringify(source || { type: "string" }));
    const defs = result.$defs || {};
    const mapping = new Map<string, string>();
    for (const key of Object.keys(defs)) {
      mapping.set(
        key,
        `Schema${Object.keys(definitions).length + mapping.size + 1}`,
      );
    }
    const visit = (node: any) => {
      if (!node || typeof node !== "object") {
        return;
      }
      if (node.$ref?.startsWith("#/$defs/")) {
        const key = node.$ref.slice(8).replace(/~1/g, "/").replace(/~0/g, "~");
        const name = mapping.get(key);
        if (!name) {
          throw new Error(`Unresolved local schema reference: ${node.$ref}`);
        }
        node.$ref = `${v2 ? "#/definitions/" : "#/components/schemas/"}${name}`;
      }
      Object.values(node).forEach(visit);
    };
    visit(result);
    for (const [key, name] of mapping) {
      definitions[name] = defs[key];
    }
    delete result.$defs;
    return result;
  };
  function security(auth?: Auth): Document[] | undefined {
    if (!auth || auth.type === "inherit") {
      return undefined;
    }
    if (auth.type === "noauth") {
      return [];
    }
    let s: Document;
    if (auth.type === "basic") {
      s = v2 ? { type: "basic" } : { type: "http", scheme: "basic" };
    } else if (auth.type === "bearer") {
      s = v2
        ? { type: "apiKey", name: "Authorization", in: "header" }
        : { type: "http", scheme: "bearer" };
    } else if (auth.type === "apikey") {
      s = {
        type: "apiKey",
        name: auth.values?.key || "X-API-Key",
        in: auth.values?.in || "header",
      };
    } else {
      warn(
        warnings,
        "auth",
        auth.type,
        "Authentication cannot be represented in OpenAPI",
      );
      return undefined;
    }
    const name = `auth${Object.keys(securitySchemes).length + 1}`;
    securitySchemes[name] = s;
    return [{ [name]: [] }];
  }
  const servers = collection.environments
    .filter((e) => e.url)
    .map((e) => ({ url: e.url!, description: e.name }));
  function write(
    items: Item[],
    tags: string[] = [],
    inherited = collection.auth,
  ) {
    for (const item of items) {
      const auth = item.auth || inherited;
      if (item.children) {
        write(item.children, [...tags, item.name], auth);
        continue;
      }
      const r = item.request!;
      const method = r.method.toLowerCase();
      if (!methods.has(method) || (v2 && method === "trace")) {
        warn(
          warnings,
          "method",
          item.name,
          `Unsupported OpenAPI method: ${r.method}`,
        );
        continue;
      }
      let path = r.url.split("?")[0].split("#")[0];
      const matchingServer = servers.find(
        (s) =>
          path === s.url || path.startsWith(s.url.replace(/\/$/, "") + "/"),
      );
      const relativeToServer = matchingServer
        ? path.slice(matchingServer.url.replace(/\/$/, "").length) || "/"
        : undefined;
      const absolute = path.match(/^(https?:\/\/[^/]+)(.*)$/);
      let server: string | undefined;
      if (absolute) {
        server = absolute[1];
        path = absolute[2] || "/";
      }
      if (matchingServer) {
        server = matchingServer.url;
        path = relativeToServer!;
      }
      const templated = path.match(/^(\{\{[^}]+\}\})(\/.*)$/);
      if (templated) {
        path = templated[2];
        warn(
          warnings,
          "server-variable",
          item.name,
          "Resolve the URL base variable in a server before using this specification",
        );
      }
      path = path.replace(/:([\w-]+)/g, "{$1}");
      if (!path.startsWith("/")) {
        path = "/" + path;
      }
      if (paths[path]?.[method]) {
        warn(
          warnings,
          "duplicate-operation",
          item.name,
          `Duplicate ${r.method} ${path} was skipped`,
        );
        continue;
      }
      const op: Document = {
        summary: item.name,
        description: item.description,
        tags: r.tags?.length ? r.tags : tags,
        parameters: [],
        responses: {},
        security: security(r.auth || auth),
      };
      if (server && !v2) {
        op.servers = [{ url: server }];
      }
      if (server && !servers.some((s) => s.url === server)) {
        servers.push({ url: server, description: item.name });
      }
      for (const [location, values] of [
        ["query", r.query],
        ["header", r.headers],
        ["path", r.path],
        ["cookie", r.cookies],
      ] as [string, Parameter[]][]) {
        for (const p of values.filter((p) => p.enabled !== false)) {
          if (v2 && location === "cookie") {
            warn(
              warnings,
              "cookie",
              item.name,
              "Swagger 2.0 cannot describe cookie parameters",
            );
            continue;
          }
          const s = schema(p.schema || { type: "string" });
          op.parameters.push({
            name: p.name,
            in: location,
            required: location === "path" || !!p.required,
            description: p.description,
            ...(v2
              ? { ...s, "x-example": p.value }
              : { schema: s, example: p.value }),
          });
        }
      }
      for (const match of path.matchAll(/\{([^}]+)\}/g)) {
        if (
          !op.parameters.some(
            (p: any) => p.in === "path" && p.name === match[1],
          )
        ) {
          op.parameters.push({
            name: match[1],
            in: "path",
            required: true,
            ...(v2 ? { type: "string" } : { schema: { type: "string" } }),
          });
        }
      }
      const b = r.body;
      if (b && b.mode !== "none") {
        const type =
          b.contentType ||
          r.headers.find((h) => h.name.toLowerCase() === "content-type")
            ?.value ||
          mime(b.mode);
        let s = b.schema
          ? schema(b.schema)
          : {
              type: b.mode === "json" ? "object" : "string",
              ...(b.mode === "binary" ? { format: "binary" } : {}),
            };
        const form = b.mode === "form-data" || b.mode === "urlencoded";
        if (form) {
          s = {
            type: "object",
            properties: Object.fromEntries(
              (b.parameters || [])
                .filter((p) => p.enabled !== false)
                .map((p) => [
                  p.name,
                  p.file
                    ? { type: "string", format: "binary" }
                    : schema(p.schema || { type: "string", example: p.value }),
                ]),
            ),
            required: (b.parameters || [])
              .filter((p) => p.required)
              .map((p) => p.name),
          };
        }
        let example: any = b.raw;
        if (b.mode === "json" && b.raw) {
          try {
            example = JSON.parse(b.raw);
          } catch {
            warn(
              warnings,
              "json",
              item.name,
              "Body contains JSON variables or invalid JSON; example kept as text",
            );
          }
        }
        if (v2) {
          op.consumes = [type];
          if (form) {
            for (const p of (b.parameters || []).filter(
              (p) => p.enabled !== false,
            )) {
              op.parameters.push({
                name: p.name,
                in: "formData",
                required: !!p.required,
                description: p.description,
                type: p.file ? "file" : p.schema?.type || "string",
                "x-example": p.value,
              });
            }
          } else {
            op.parameters.push({
              name: "body",
              in: "body",
              schema: s,
              "x-example": example,
            });
          }
        } else {
          op.requestBody = { content: { [type]: { schema: s, example } } };
        }
      }
      for (const response of r.responses) {
        const code = /^(?:[1-5][0-9X]{2}|default)$/.test(response.status)
          ? response.status
          : "default";
        const type = response.contentType || "application/json";
        let example: any = response.body;
        if (type.includes("json") && response.body) {
          try {
            example = JSON.parse(response.body);
          } catch {}
        }
        const s = schema(response.schema || { type: "string" });
        const headers = Object.fromEntries(
          (response.headers || []).map((h) => [
            h.name,
            v2
              ? schema(h.schema)
              : { schema: schema(h.schema), example: h.value },
          ]),
        );
        if (v2) {
          op.produces = [...new Set([...(op.produces || []), type])];
          op.responses[code] = {
            description: response.name || "Response",
            schema: s,
            examples: { [type]: example },
            headers,
          };
        } else {
          const target = (op.responses[code] ??= {
            description: response.name || "Response",
            headers,
            content: {},
          });
          const media = (target.content[type] ??= { schema: s, examples: {} });
          media.examples[`example${Object.keys(media.examples).length + 1}`] = {
            summary: response.name,
            value: example,
          };
        }
      }
      if (!Object.keys(op.responses).length) {
        op.responses.default = { description: "Response" };
      }
      (paths[path] ??= {})[method] = op;
    }
  }
  write(collection.items);
  const info = {
    title: collection.name,
    description: collection.description,
    version: "1.0.0",
  };
  if (v2) {
    const first = servers[0]?.url.match(/^(https?):\/\/([^/]+)(.*)$/);
    if (servers.length > 1) {
      warn(
        warnings,
        "servers",
        "servers",
        "Swagger 2.0 supports one server; the first was selected",
      );
    }
    return {
      data: {
        swagger: "2.0",
        info,
        ...(first
          ? { schemes: [first[1]], host: first[2], basePath: first[3] || "/" }
          : {}),
        paths,
        definitions,
        securityDefinitions: securitySchemes,
      },
      warnings,
    };
  }
  return {
    data: {
      openapi: "3.0.3",
      info,
      servers,
      paths,
      components: { schemas: definitions, securitySchemes },
    },
    warnings,
  };
}
