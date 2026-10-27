import { completionHttpProtocol as completeHttpProtocol } from "@onapi/http-model/utils/data-tools";
import { isPlainObject, isString } from "lodash";

import { useProjectConfig } from "@/app/store";

export const completionHttpProtocol = (data: any) => {
  return completeHttpProtocol(data);
};

export const completionWSProtocol = (data: any) => {
  if (isString(data)) {
    if (
      data.substr(0, 5).toLowerCase() !== "ws://" &&
      data.substr(0, 6).toLowerCase() !== "wss://"
    ) {
      data = `ws://${data}`;
    }
  } else if (
    isPlainObject(data) &&
    Object.prototype.hasOwnProperty.call(data, "url")
  ) {
    if (
      data.url.substr(0, 5).toLowerCase() !== "ws://" &&
      data.url.substr(0, 6).toLowerCase() !== "wss://"
    ) {
      data.url = `ws://${data.url}`;
    }
  }
  return data;
};

export const getWebSocketSendOptions = async (target: any) => {
  try {
    const { envDetailKeys } = useProjectConfig.getState();

    return {};
  } catch (err: any) {}
};
