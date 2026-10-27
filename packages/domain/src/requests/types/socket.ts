import { ApisBaseData } from "@onapi/domain/requests/types/base";
import { SocketRequest } from "@onapi/domain/requests/types/request";
import { BaseResponse } from "@onapi/domain/requests/types/response";

export interface SocketDetailsData extends ApisBaseData {
  // Request object
  request: SocketRequest;
  // Response object
  response: BaseResponse;
  // Whether archived (1=yes, -1=no)
  is_exampled: 1 | -1;
  // Whether locked (1=yes, -1=no)
  is_locked: 1 | -1;
  //API tags
  tags?: string[];
  description: string;
}

export type SocketComponentType = {
  apisData: SocketDetailsData;
  onApisDataChange: (data: SocketDetailsData) => void;
};
