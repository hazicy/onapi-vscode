export type GraphQLDetailsData =
  import("@onapi/domain/requests/types/api").ApiDetailsData & {
    graphqlSchema?: object;
    search_id?: string;
  };

export type ApiComponentType = {
  apisData: GraphQLDetailsData;
  onApisDataChange: (data: GraphQLDetailsData) => void;
};

export type GraphQLChangeFuncType<T> = <K extends keyof T>(
  key: K,
  value: T[K],
  search_id?: string,
) => void;

export type FilterDataType = {
  [keyPath: string]: any;
};
