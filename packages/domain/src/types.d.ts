/// <reference path="./types/postman-collection.d.ts" />

declare const __ONAPI_LANGUAGE__: "auto" | "en" | "zh-cn";

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
