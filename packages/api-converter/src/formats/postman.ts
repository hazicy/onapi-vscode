import {
  type Auth,
  type Collection,
  type Document,
  type Item,
  type Parameter,
  type Result,
  type Warning,
  description,
  emptyRequest,
  object,
  queryFromUrl,
  text,
  warn,
} from "../model";

const parameters = (values: any[] = []): Parameter[] =>
  values.map((p) => ({
    name: text(p.key),
    value: text(p.value ?? p.src),
    description: description(p.description),
    enabled: !p.disabled,
    file: p.type === "file",
    contentType: p.contentType,
  }));
function auth(value: any): Auth | undefined {
  if (!value) {
    return undefined;
  }
  return {
    type: value.type,
    values: Object.fromEntries(
      (value[value.type] || []).map((p: any) => [p.key, p.value]),
    ),
  };
}
const writeAuth = (value?: Auth) =>
  value
    ? {
        type: value.type,
        [value.type]: Object.entries(value.values || {}).map(
          ([key, value]) => ({ key, value, type: "string" }),
        ),
      }
    : undefined;
const writeParameters = (values: Parameter[] = []) =>
  values.map((p) => ({
    key: p.name,
    value: p.value,
    description: p.description,
    disabled: p.enabled === false,
    ...(p.file ? { type: "file", src: p.value } : {}),
  }));

const encodeQuery = (value: string) =>
  encodeURIComponent(value).replace(
    /%7B%7B(.*?)%7D%7D/gi,
    (_, name) => `{{${decodeURIComponent(name)}}}`,
  );

export function readPostman(input: unknown): Result<Collection> {
  const doc = object(input, "Postman collection");
  if (!doc.info?.name || !Array.isArray(doc.item)) {
    throw new Error(
      "Invalid Postman collection: info.name and item are required",
    );
  }
  if (doc.info.schema && !/\/v2\.(?:0|1)\.0\//.test(doc.info.schema)) {
    throw new Error("Only Postman collection 2.0 and 2.1 are supported");
  }
  const warnings: Warning[] = [];
  const readAuth = (value: any, path: string) => {
    if (
      value?.type &&
      !["basic", "bearer", "apikey", "noauth"].includes(value.type)
    ) {
      warn(
        warnings,
        "auth",
        path,
        `Authentication ${value.type} may require manual field configuration`,
      );
    }
    return auth(value);
  };
  function read(items: any[], path: string): Item[] {
    return items.map((value, index) => {
      const location = `${path}[${index}]`;
      if (value.event?.length) {
        warn(
          warnings,
          "scripts",
          location,
          "Postman scripts require its runtime and were not converted",
        );
      }
      const item: Item = {
        name: text(value.name),
        description: description(value.description),
        auth: readAuth(value.auth, location),
        variables: parameters(value.variable),
      };
      if (Array.isArray(value.item)) {
        item.children = read(value.item, `${location}.item`);
        return item;
      }
      const source =
        typeof value.request === "string"
          ? { url: value.request }
          : object(value.request, `${location}.request`);
      const url =
        typeof source.url === "string"
          ? source.url
          : source.url?.raw ||
            [
              source.url?.protocol ? `${source.url.protocol}://` : "",
              Array.isArray(source.url?.host)
                ? source.url.host.join(".")
                : source.url?.host || "",
              "/",
              Array.isArray(source.url?.path)
                ? source.url.path.join("/")
                : source.url?.path || "",
            ].join("");
      const request = emptyRequest(url, source.method || "GET");
      request.headers =
        typeof source.header === "string"
          ? source.header
              .split(/\r?\n/)
              .filter(Boolean)
              .map((line: string) => {
                const i = line.indexOf(":");
                return {
                  name: line.slice(0, i),
                  value: line.slice(i + 1).trim(),
                };
              })
          : parameters(source.header);
      request.query = source.url?.query
        ? parameters(source.url.query)
        : queryFromUrl(url);
      request.path = parameters(source.url?.variable);
      request.auth = readAuth(source.auth, location);
      item.description = description(source.description) || item.description;
      const body = source.body;
      if (body) {
        if (body.mode === "raw") {
          request.body = {
            mode:
              body.options?.raw?.language ||
              (request.headers.some(
                (h) =>
                  h.name.toLowerCase() === "content-type" &&
                  h.value.includes("json"),
              )
                ? "json"
                : "plain"),
            raw: text(body.raw),
          };
        } else if (body.mode === "formdata" || body.mode === "urlencoded") {
          request.body = {
            mode: body.mode === "formdata" ? "form-data" : "urlencoded",
            parameters: parameters(body[body.mode]),
          };
        } else if (body.mode === "file") {
          request.body = { mode: "binary", file: body.file?.src };
        } else {
          warn(
            warnings,
            "body-mode",
            location,
            `Unsupported Postman body mode: ${body.mode}`,
          );
        }
      }
      request.responses = (value.response || []).map((response: any) => ({
        name: response.name || response.status || "Response",
        status: text(response.code || 200),
        body: text(response.body),
        contentType:
          (response.header || []).find(
            (h: any) => h.key?.toLowerCase() === "content-type",
          )?.value || "application/json",
        headers: parameters(response.header),
      }));
      item.request = request;
      return item;
    });
  }
  if (doc.event?.length) {
    warn(warnings, "scripts", "event", "Collection scripts were not converted");
  }
  return {
    data: {
      name: doc.info.name,
      description: description(doc.info.description),
      items: read(doc.item, "item"),
      variables: parameters(doc.variable),
      environments: [],
      auth: readAuth(doc.auth, "auth"),
    },
    warnings,
  };
}

export function writePostman(collection: Collection): Result<Document> {
  const warnings: Warning[] = [];
  if (collection.environments.length > 1) {
    warn(
      warnings,
      "environments",
      "environments",
      "Postman collections carry one set of variable defaults; defaults from the first environment were used",
    );
  }
  const variables = new Map(
    (collection.environments[0]?.variables || []).map((p) => [p.name, p]),
  );
  for (const p of collection.variables) {
    variables.set(p.name, p);
  }
  function write(items: Item[]): Document[] {
    return items.map((item) => {
      if (item.children) {
        return {
          name: item.name,
          description: item.description,
          auth: writeAuth(item.auth),
          variable: writeParameters(item.variables),
          item: write(item.children),
        };
      }
      const r = item.request!;
      const body = r.body;
      const header = writeParameters(r.headers);
      if (r.cookies.length) {
        header.push({
          key: "Cookie",
          value: r.cookies
            .filter((p) => p.enabled !== false)
            .map((p) => `${p.name}=${p.value}`)
            .join("; "),
          description: undefined,
          disabled: false,
        });
      }
      const request: Document = {
        method: r.method,
        description: item.description,
        header,
        auth: writeAuth(r.auth),
        url: {
          raw:
            r.url.split("?")[0] +
            (r.query.filter((p) => p.enabled !== false).length
              ? "?" +
                r.query
                  .filter((p) => p.enabled !== false)
                  .map((p) => `${encodeQuery(p.name)}=${encodeQuery(p.value)}`)
                  .join("&")
              : ""),
          query: writeParameters(r.query),
          variable: writeParameters(r.path),
        },
      };
      if (body && body.mode !== "none") {
        if (body.mode === "form-data" || body.mode === "urlencoded") {
          const mode = body.mode === "form-data" ? "formdata" : "urlencoded";
          request.body = { mode, [mode]: writeParameters(body.parameters) };
        } else if (body.mode === "binary") {
          request.body = { mode: "file", file: { src: body.file || "" } };
        } else {
          request.body = {
            mode: "raw",
            raw: body.raw || "",
            options: {
              raw: { language: body.mode === "plain" ? "text" : body.mode },
            },
          };
        }
        if (body.schema) {
          warn(
            warnings,
            "schema",
            item.name,
            "Postman raw bodies do not preserve JSON Schema",
          );
        }
      }
      if (r.responses.some((response) => response.schema)) {
        warn(
          warnings,
          "schema",
          item.name,
          "Postman response examples do not preserve JSON Schema",
        );
      }
      return {
        name: item.name,
        request,
        response: r.responses.map((response) => ({
          name: response.name,
          originalRequest: request,
          status: response.name,
          code: Number(response.status) || 200,
          header: writeParameters(
            response.headers?.length
              ? response.headers
              : [{ name: "Content-Type", value: response.contentType }],
          ),
          body: response.body,
        })),
      };
    });
  }
  return {
    data: {
      info: {
        name: collection.name,
        description: collection.description,
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      auth: writeAuth(collection.auth),
      variable: writeParameters([...variables.values()]),
      item: write(collection.items),
    },
    warnings,
  };
}
