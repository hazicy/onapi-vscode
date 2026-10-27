import {
  type Collection,
  type Item,
  type Parameter,
  type Result,
  type Warning,
  emptyRequest,
  object,
  queryFromUrl,
  text,
  warn,
} from "../model";

export function readThunder(input: unknown): Result<Collection> {
  const doc = object(input, "Thunder Client collection");
  if (!Array.isArray(doc.requests) || !Array.isArray(doc.folders)) {
    throw new Error("Invalid Thunder Client collection");
  }
  const warnings: Warning[] = [];
  const items: Item[] = [];
  const folders = new Map<string, Item>();
  for (const folder of doc.folders) {
    if (!folder._id || folders.has(folder._id)) {
      throw new Error("Invalid or duplicate Thunder folder ID");
    }
    folders.set(folder._id, { name: folder.name, children: [] });
  }
  for (const folder of doc.folders) {
    const visited = new Set([folder._id]);
    let parent = folder.containerId;
    while (parent && folders.has(parent)) {
      if (visited.has(parent)) {
        throw new Error("Cyclic Thunder folder hierarchy");
      }
      visited.add(parent);
      parent = doc.folders.find((f: any) => f._id === parent)?.containerId;
    }
    (folders.get(folder.containerId)?.children || items).push(
      folders.get(folder._id)!,
    );
  }
  const params = (values: any[] = []): Parameter[] =>
    values.map((p) => ({
      name: text(p.name || p.key),
      value: text(p.value),
      enabled: p.isDisabled !== true && p.active !== false,
      description: p.description,
      file: p.type === "file",
    }));
  for (const source of doc.requests) {
    const request = emptyRequest(source.url, source.method);
    request.headers = params(source.headers);
    request.query = source.params
      ? params(source.params)
      : queryFromUrl(source.url);
    const body = source.body;
    if (body) {
      const modes: Record<string, string> = {
        form: "form-data",
        formdata: "form-data",
        formencoded: "urlencoded",
        text: "plain",
      };
      request.body = {
        mode: modes[body.type] || body.type || "none",
        raw: Array.isArray(body.raw) ? body.raw.join("\n") : text(body.raw),
        parameters: params(body.params || body.form),
        file: body.file,
      };
      if (
        ![
          "none",
          "json",
          "plain",
          "xml",
          "html",
          "javascript",
          "form-data",
          "urlencoded",
          "binary",
        ].includes(request.body.mode)
      ) {
        request.body.mode = "none";
        warn(
          warnings,
          "body-mode",
          source.name,
          `Body mode ${body.type} requires manual configuration`,
        );
      }
    }
    if (source.auth) {
      const a = source.auth;
      if (a.type === "bearer") {
        request.auth = {
          type: "bearer",
          values: { token: a.bearer || a.token || "" },
        };
      } else if (a.type === "basic") {
        request.auth = {
          type: "basic",
          values: a.basic || {
            username: a.username || "",
            password: a.password || "",
          },
        };
      } else if (a.type === "apikey") {
        request.auth = {
          type: "apikey",
          values: { key: a.key, value: a.value, in: a.placement || "header" },
        };
      } else if (a.type === "none") {
        request.auth = { type: "noauth" };
      } else {
        warn(
          warnings,
          "auth",
          source.name,
          `Unsupported Thunder authentication: ${a.type}`,
        );
      }
    }
    if (
      source.tests?.length ||
      source.preReq ||
      source.postReq ||
      source.preScripts?.length ||
      source.postScripts?.length
    ) {
      warn(
        warnings,
        "scripts",
        source.name,
        "Thunder scripts and tests were not converted",
      );
    }
    (folders.get(source.containerId)?.children || items).push({
      name: source.name,
      description: source.description,
      request,
    });
  }
  return {
    data: {
      name: doc.collectionName || "Thunder Client",
      items,
      variables: [],
      environments: [],
    },
    warnings,
  };
}
