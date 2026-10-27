export type FolderDetailsData = Omit<
  import("@onapi/http-model/requests/types/api").ApiDetailsData,
  "request"
> & { request?: never };

export type FolderComponentType = {
  apisData: FolderDetailsData;
  onApisDataChange: (data: FolderDetailsData) => void;
};
