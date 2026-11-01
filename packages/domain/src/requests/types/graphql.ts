export type GraphQLChangeFuncType<T> = <K extends keyof T>(
  key: K,
  value: T[K],
  search_id?: string,
) => void;

export type FilterDataType = {
  [keyPath: string]: any;
};
