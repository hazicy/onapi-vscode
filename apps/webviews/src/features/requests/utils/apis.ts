import { httpRequestSchema } from "@onapi/domain/requests/record";
import { getCollectionServerId } from "@onapi/domain/request-utils";
import { ApisBaseDataItem } from "@onapi/domain/requests/types/base";
import urlParse from "url-parse";
import {
  isURL,
  getUrlQueryToArray,
  createUrl,
} from "../../../shared/utils/common";
import {
  cloneDeep,
  filter,
  find,
  forEach,
  isArray,
  isEqual,
  isUndefined,
  map,
} from "lodash-es";
import { STATUS_CODE } from "@onapi/domain/constants/common";
import { snowflakeId } from "@onapi/domain/utils/data-tools";
import { ApisData } from "@onapi/domain/requests/types/api";
import { EnvListItem } from "@onapi/domain/environment/types/index";

import { ApiSendResponseData } from "@onapi/domain/requests/types/send";
import { formatTime, TIME_FORMAT } from "@onapi/domain/utils/time";
import dayjs from "dayjs";
import { DEFAULT_API_RESPONSE } from "@onapi/domain/requests/constants/response";
import { CurlDataType } from "@/features/requests/types/other";

// Generate new query array based on url
export const genQueryByUrl = (
  url: string,
  oldParameter: Array<ApisBaseDataItem>,
): Array<ApisBaseDataItem> => {
  // Auto-prepend url http://
  if (!isURL(url)) {
    url = `http://${url}`;
  }

  const urlQuery = urlParse(url)?.query || "";

  // Extract query
  const searchParams = getUrlQueryToArray(urlQuery);

  const queryList = filter(oldParameter, (item: ApisBaseDataItem) =>
    isEqual(item?.is_checked, STATUS_CODE.DISABLE),
  );

  const enabledParameters = filter(oldParameter, (item: ApisBaseDataItem) =>
    isEqual(item?.is_checked, STATUS_CODE.ENABLE),
  );

  forEach(searchParams, (item, index) => {
    const originObj = enabledParameters[index];

    queryList.push({
      param_id: originObj?.param_id || snowflakeId(),
      field_type: originObj?.field_type || "String", // Type
      is_checked: originObj?.is_checked || 1, // Whether enabled
      key: item?.key?.trim(), // Parameter name
      not_null: originObj?.not_null || 1, // Required | -1 optional
      value: item?.value?.trim(), // Parameter value
      description: originObj?.description || "", // Field description
    });
  });

  return queryList;
};

// Generate new restful array based on url
export const genRestfulByUrl = (
  url: string,
  oldParameter: Array<ApisBaseDataItem>,
): Array<ApisBaseDataItem> => {
  const restfulList: ApisBaseDataItem[] = [];
  // Keep the first matching row, including when saved parameters contain duplicates.
  const parametersByKey = new Map<string, ApisBaseDataItem>();
  forEach(oldParameter, (item) => {
    if (!parametersByKey.has(item.key)) {
      parametersByKey.set(item.key, item);
    }
  });

  const appendParameter = (key: string) => {
    const previous = parametersByKey.get(key);
    restfulList.push({
      param_id: previous?.param_id || snowflakeId(),
      field_type: "String",
      is_checked: 1,
      key,
      not_null: 1,
      value: previous?.value || "",
      description: previous?.description || "",
    });
  };

  if (!isURL(url)) {
    url = `http://${url}`;
  }
  const paths = createUrl(url).pathname.split("/");
  forEach(paths, (segment) => {
    if (segment.startsWith(":") && segment.length > 1) {
      appendParameter(segment.slice(1));
    }
  });

  // Double braces represent variables rather than REST path parameters.
  for (const match of url.matchAll(/(?<!{){([^{}]+)}(?!})/g)) {
    appendParameter(match[1]);
  }
  return restfulList;
};

// Generate new url based on query array

// Get cloned api data

// Get api server id

// Get api base url
export const getBaseUrl = (
  id: string,
  apisData: { [x: string]: ApisData },
  envInfo?: EnvListItem,
): string => {
  const currentServerId = getCollectionServerId(id, apisData);
  const serversData = find(
    envInfo?.server_list,
    (it) => it?.server_id === currentServerId,
  );

  if (isUndefined(serversData)) {
    return (
      find(envInfo?.server_list, (filterItem) =>
        isEqual(filterItem.server_id, "1"),
      )?.uri || ""
    );
  }

  return serversData?.uri || "";
};

function getNowAt(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  // Get timezone offset (minutes)
  const offset = -now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetSign = offset >= 0 ? "+" : "-";

  // Build timezone string
  const timeZoneString = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(
    offsetMinutes,
  ).padStart(2, "0")}`;

  // Build final datetime string
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timeZoneString}`;
}

export const createBatchApi = (
  data: any,
  maxSort?: number,
  folder_id?: string,
) => {
  // Get max sort in directory
  let baseSort = maxSort || 0;
  const nowAt = getNowAt();
  const list = [];
  if (isArray(data)) {
    for (let index = 0; index < data.length; index++) {
      const item = cloneDeep(data[index]);
      if (
        !["api", "folder", "websocket", "sse", "socketio", "graphql"].includes(
          item.kind,
        )
      ) {
        continue;
      }
      item.updated_at = nowAt;
      if (!item?.created_at) {
        item["created_at"] = nowAt;
      }
      if (!item?.response && item?.kind === "api") {
        item["response"] = cloneDeep(DEFAULT_API_RESPONSE);
      }
      if (!item?.parentId || item?.parentId === "0") {
        item.parentId = folder_id || "0";
      }
      item.version = 1;
      if (!item?.id) {
        item.id = snowflakeId();
        item.parentId = "0";
      }

      if (item?.sort < 1) {
        baseSort += 1;
        // Calculate appropriate sort
        item.sort = baseSort;
      }
      list.push(item);
    }
  }

  // await guestDB.api_details_data.bulkPut(list);
  return list;
};

export const handleResponseConsole = (
  console: ApiSendResponseData["console"],
) => {
  const _console = cloneDeep(console);

  const time = formatTime(dayjs(), TIME_FORMAT.TIME_L);

  return map(_console, (item) => ({
    ...item,
    time: item?.time || time,
  }));
};

export const getNewApisDataByCurlChange = <
  T extends { request: import("@onapi/domain").HttpRequest },
>(
  apisData: T,
  curlData: CurlDataType,
) => ({ ...apisData, request: httpRequestSchema.parse(curlData.request) });

export {
  genUrlByQuery,
  getHistoryOpensData,
  getCollectionServerId,
  getParameterDataFilterContentLength,
} from "@onapi/domain/request-utils";
