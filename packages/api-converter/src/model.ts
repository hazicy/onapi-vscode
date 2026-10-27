// Wire-format documents are validated by each reader before normalization.
export type Document = Record<string, any>;
export interface Warning {
  code: string;
  path: string;
  message: string;
}
export interface Result<T> {
  data: T;
  warnings: Warning[];
}
export interface Parameter {
  name: string;
  value: string;
  description?: string;
  enabled?: boolean;
  required?: boolean;
  schema?: Document;
  file?: boolean;
  contentType?: string;
}
export interface Body {
  mode: string;
  raw?: string;
  parameters?: Parameter[];
  schema?: Document;
  contentType?: string;
  file?: string;
}
export interface Auth {
  type: string;
  values?: Record<string, any>;
}
export interface Response {
  name: string;
  status: string;
  body: string;
  contentType: string;
  schema?: Document;
  headers?: Parameter[];
}
export interface Request {
  method: string;
  url: string;
  headers: Parameter[];
  query: Parameter[];
  path: Parameter[];
  cookies: Parameter[];
  auth?: Auth;
  body?: Body;
  responses: Response[];
  tags?: string[];
}
export interface Item {
  name: string;
  description?: string;
  children?: Item[];
  request?: Request;
  auth?: Auth;
  variables?: Parameter[];
}
export interface Environment {
  name: string;
  url?: string;
  variables: Parameter[];
}
export interface Collection {
  name: string;
  description?: string;
  items: Item[];
  variables: Parameter[];
  environments: Environment[];
  auth?: Auth;
}
export const text = (value: any): string =>
  value === null || value === undefined
    ? ""
    : typeof value === "string"
      ? value
      : JSON.stringify(value);
export const description = (value: any): string =>
  typeof value === "string" ? value : value?.content || "";
export const warn = (
  warnings: Warning[],
  code: string,
  path: string,
  message: string,
) => warnings.push({ code, path, message });
export function object(value: unknown, label: string): Document {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Document;
}
export function queryFromUrl(url: string): Parameter[] {
  const query = url.split("?")[1]?.split("#")[0];
  return query
    ? Array.from(new URLSearchParams(query), ([name, value]) => ({
        name,
        value,
      }))
    : [];
}
export const emptyRequest = (url = "", method = "GET"): Request => ({
  url,
  method: method.toUpperCase(),
  headers: [],
  query: [],
  path: [],
  cookies: [],
  responses: [],
});
