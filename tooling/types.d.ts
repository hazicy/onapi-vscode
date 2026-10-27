/// <reference path="./postman-collection.d.ts" />

declare const __ONAPI_LANGUAGE__: "auto" | "en" | "zh-cn";
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
declare module "postman-collection/lib/collection/url.js" {
  export const Url: typeof import("postman-collection").Url;
}
declare module "postman-runtime";
declare module "pako";

declare module "curl-to-postmanv2";
