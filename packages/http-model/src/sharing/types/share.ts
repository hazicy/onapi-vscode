import { ApiDetailsData } from "@onapi/http-model/requests/types/api";

export type ShareInfo = {
  netUrl: string;
  apiName: string;
  apiData: ApiDetailsData | null;
};

export type ShareInfoData = {
  id: string;
  share_time: number;
};

export type DocPageData = {
  net_url: string;
  fileName: string;
  openApiStr: string;
};
