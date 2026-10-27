declare module "curl-to-postmanv2";

/** Selected by the extension and Webview build. */
declare const __ONAPI_LANGUAGE__: "auto" | "en" | "zh-cn";

declare module "*.module.css" {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

declare module "*.css" {}

declare module "json2json-schema" {
  export function toJsonSchema(value: unknown): Record<string, unknown>;
}

declare module "pako" {
  export function inflate(data: Uint8Array): Uint8Array;
}

declare module "postman-url-encoder/parser/index.js" {
  export function parse(raw: string): {
    raw: string;
    protocol?: string;
    host?: string[];
    port?: string;
    path?: string[];
    hash?: string;
    auth?: [string, string];
    query?: string[];
  };
}
