import { requestUrl, requestMethod } from "@onapi/domain";
import { getCollectionServerId } from "@onapi/domain/request-utils";
import {
  ApisBaseDataItem,
  TypeFiledType,
} from "@onapi/domain/requests/types/base";
import urlParse from "url-parse";
import {
  isURL,
  getUrlQueryToArray,
  createUrl,
  isJSON,
} from "../../../shared/utils/common";
import {
  cloneDeep,
  filter,
  find,
  forEach,
  isArray,
  isEqual,
  isPlainObject,
  isString,
  isUndefined,
  map,
} from "lodash-es";
import {
  CONTENT_TYPES,
  OPENAPI_TYPES,
  STATUS_CODE,
} from "@onapi/domain/constants/common";
import { snowflakeId } from "@onapi/domain/utils/data-tools";
import { AnyObject } from "@onapi/domain/types/common";
import {
  ApiDetailsData,
  ApisData,
  ParametersItem,
} from "@onapi/domain/requests/types/api";
import { EnvListItem } from "@onapi/domain/environment/types/index";
import useApis from "@/features/requests/store/useApis";
import { ApiSendResponseData } from "@onapi/domain/requests/types/send";
import { formatTime, TIME_FORMAT } from "@onapi/domain/utils/time";
import dayjs from "dayjs";
import { ApisBaseRequestBody } from "@onapi/domain/requests/types/request";
import { DEFAULT_API_RESPONSE } from "@onapi/domain/requests/constants/response";
import { WebSocketDetailsData } from "@onapi/domain/requests/types/websocket";
import { SocketIoDetailsData } from "@onapi/domain/requests/types/socketio";
import { UrlGroupProps } from "@/features/requests/editor/UrlGroup";
import { produce } from "immer";
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
      if (!item?.parentId || item?.parentId == "0") {
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

export const capitalizeFirstLetter = (str: string) => {
  if (!str) {
    return "";
  } // If input string is empty, return directly
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const openApiParamsToOnapiParams = (arr: ParametersItem[]) => {
  const newParams: ApisBaseDataItem[] = [];
  arr.forEach((item) => {
    newParams.push({
      param_id: snowflakeId(),
      is_checked: 1,
      key: item?.name || "",
      value: item?.example || "",
      description: item?.description || "",
      field_type: capitalizeFirstLetter(item.schema.type) as TypeFiledType,
    });
  });
  return newParams;
};

export const onapiParamsToOpenApiParams = (
  arr: ApisBaseDataItem[],
  inType: "header" | "query" | "cookie",
) => {
  const newParams: ParametersItem[] = [];
  arr.forEach((item) => {
    newParams.push({
      name: item.key,
      in: inType,
      description: item?.description || "",
      required: item.is_checked == 1,
      example: item?.value || "",
      schema: {
        type:
          item.field_type === "Object"
            ? "object"
            : item.field_type === "Array"
              ? "array"
              : item.field_type === "Boolean"
                ? "boolean"
                : item.field_type === "Integer"
                  ? "integer"
                  : ["Number", "Float", "Double"].includes(
                        item.field_type || "",
                      )
                    ? "number"
                    : "string",
      },
    });
  });
  return newParams;
};

export const openApiRequestBodyToOnapiRequestBody = (content: AnyObject) => {
  const body: ApisBaseRequestBody = {
    mode: "none",
    raw: "",
    raw_parameter: [],
    raw_schema: {},
  };
  const mode = Object.keys(content)[0];
  const bodyInfo = content[mode];
  if (OPENAPI_TYPES?.[mode]) {
    body.mode = OPENAPI_TYPES?.[mode];
  }
  if (isString(bodyInfo?.example)) {
    body.raw = bodyInfo.example;
  }

  if (
    isPlainObject(bodyInfo.schema.properties) &&
    ["application/x-www-form-urlencoded", "multipart/form-data"].includes(mode)
  ) {
    forEach(bodyInfo.schema.properties, (val, key) => {
      body.raw_parameter.push({
        is_checked: 1,
        key: key,
        value: val?.example || "",
        description: val?.description || "",
        field_type: capitalizeFirstLetter(
          val?.type || "String",
        ) as TypeFiledType,
      });
    });
  }
  if (
    isPlainObject(bodyInfo.schema.properties) &&
    !["application/x-www-form-urlencoded", "multipart/form-data"].includes(mode)
  ) {
    let newObj: any = {};
    forEach(bodyInfo.schema.properties, (val, key) => {
      newObj[key] = val?.format || val?.example || "";
    });
    body.raw = JSON.stringify(newObj, null, "\t");
  }
  return body;
};

export const OnapiRequestBodyToopenApiRequestBody = (
  body: ApisBaseRequestBody,
) => {
  let newContent: any = {
    type: "object",
    properties: {
      required: [],
    },
  };
  const mode = CONTENT_TYPES?.[body.mode];
  if (mode == "none") {
    return newContent;
  }
  if (["form-data", "urlencoded"].includes(mode)) {
    forEach(body.parameter, (item) => {
      newContent.properties[item.key] = {
        type: item?.field_type?.toLocaleLowerCase() || "string",
        example: item?.value || "",
        description: item.description || "",
      };
      if (item.is_checked) {
        newContent.properties.required.push(item.key);
      }
    });
  }
  if (!["form-data", "urlencoded"].includes(mode)) {
    if (isJSON(body.raw)) {
      const obj = JSON.parse(body.raw);
      forEach(obj, (val, key) => {
        newContent.properties[key] = {
          type: "string",
          example: val || "",
          description: "",
        };
        newContent.properties.required.push(key);
      });
    } else {
      newContent.properties.example = String(body.raw);
    }
  }
};

export const fillInOpenApi = async (apiData: ApiDetailsData) => {
  if (!isPlainObject(apiData?.open_api)) {
    apiData.open_api = {
      [requestUrl(apiData) || "/"]: {
        [requestMethod(apiData).toLocaleLowerCase()]: {
          summary: apiData?.name || "",
          description: "",
          tags: [],
          parameters: [],
          requestBody: {
            content: {},
          },
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {},
                  },
                  example: "",
                },
              },
            },
            "404": {
              description: "Failure",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {},
                  },
                  example: "",
                },
              },
            },
          },
        },
      },
    };
  }
  return apiData;
};

export const genNewWsByUrlChange = (
  apisData: WebSocketDetailsData | SocketIoDetailsData,
  urlData: UrlGroupProps["data"],
): WebSocketDetailsData | SocketIoDetailsData => {
  const result = produce(apisData, (draft) => {
    draft.url = urlData.url || "";

    if (urlData.url) {
      if (isArray(draft?.request?.query?.parameter)) {
        draft.request.query.parameter = genQueryByUrl(
          `${urlData.url}`,
          draft?.request?.query?.parameter || [],
        );
      }
    } else {
      if (draft.request.query?.parameter) {
        draft.request.query.parameter = [];
      }
    }
  });

  return result;
};

export const getNewApisDataByCurlChange = (
  apisData: ApiDetailsData,
  curlData: CurlDataType,
) => ({ ...apisData, request: curlData.request });

export {
  genUrlByQuery,
  getHistoryOpensData,
  getCollectionServerId,
  getParameterDataFilterContentLength,
} from "@onapi/domain/request-utils";
