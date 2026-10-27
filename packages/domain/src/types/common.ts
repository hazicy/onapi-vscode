export type HttpStatusCode =
  | "200"
  | "201"
  | "202"
  | "204"
  | "400"
  | "401"
  | "403"
  | "404"
  | "410"
  | "422"
  | "500"
  | "502"
  | "503"
  | "504";

export type CompareCalcSymbols =
  | "eq"
  | "uneq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "includes"
  | "unincludes"
  | "null"
  | "notnull"
  | "";

export type CustomNumberBooleanType = 1 | -1;

export type DirectionType = "horizontal" | "vertical";

export type ChangeFuncType<T> = <K extends keyof T>(
  key: K,
  newValue: T[K],
) => void;

export type PropertyKey = string | number | symbol;
export type AnyObject = Record<PropertyKey, any>;

export type User = {
  uid: string;
  nick_name: string;
  portrait: string;
};
