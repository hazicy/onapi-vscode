import { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { get, post } from "./utils";
import { ApisBaseData } from "@onapi/domain/requests/types/base";

/**
 * API brief info list
 */
export const getApisListService = (data: {
  project_id: string;
}): Promise<{ list: ApisBaseData[] }> => {
  return get({ url: "/ide/vscode/apis/list", data });
};

/**
 * Batch get API details
 */
export const getApisDetailsRequest = (data: {
  project_id: string;
  ids: string[];
}): Promise<{ list: ApiDetailsData[] }> =>
  post({ url: "/ide/vscode/apis/details", data });

/**
 * Batch save APIs
 */
export const batchSaveApiService = (data: {
  project_id: string;
  apis: ApiDetailsData[];
}): Promise<{ list: ApiDetailsData[] }> =>
  post({ url: "/ide/vscode/apis/batch_save", data });
