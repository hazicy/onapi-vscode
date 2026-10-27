export type FolderDetailsData = Omit<
  import("@onapi/domain/requests/types/api").ApiDetailsData,
  "request"
> & { request?: never };

export type FolderComponentType = {
  apisData: FolderDetailsData;
  onApisDataChange: (data: FolderDetailsData) => void;
};
