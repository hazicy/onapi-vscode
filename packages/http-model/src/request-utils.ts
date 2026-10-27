import {
  cloneDeep,
  concat,
  find,
  head,
  indexOf,
  isArray,
  isEqual,
  isUndefined,
  isString,
  keys,
  map,
  omit,
  reduce,
  size,
  forEach,
  filter,
  toUpper,
} from "lodash";
import JSON5 from "json5";
import { produce } from "immer";
import urlParse from "url-parse";
import type { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import type { ApisBaseDataItem } from "@onapi/http-model/requests/types/base";
import type { ServerItem } from "@onapi/http-model/environment/types/index";
import type { SysConfig } from "@onapi/http-model/settings/types/settings";
import type { CustomNumberBooleanType } from "@onapi/http-model/types/common";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/http-model/requests/constants/index";
import { STATUS_CODE } from "@onapi/http-model/constants/common";
import { snowflakeId } from "@onapi/http-model/utils/data-tools";
export const getUpwardFolderId = (
  list: any[] | { [key: string]: any },
  id: string,
) => {
  let arr = list;
  if (!Array.isArray(list)) {
    arr = Object.entries(list)?.map(([_, v]) => v);
  }
  try {
    const res = arr.reduce((prev: string[], curr: any) => {
      if (curr.id === id) {
        prev = prev.concat(getUpwardFolderId(arr, curr.parentId));
        if (
          curr.kind === APIS_TARGET_TYPE_ENUM.FOLDER ||
          curr.kind === APIS_TARGET_TYPE_ENUM.SOCKET ||
          curr.kind === APIS_TARGET_TYPE_ENUM.API // api type is for compatibility with interface use cases
        ) {
          prev.push(curr.id);
        }
      }
      return prev;
    }, []);
    return res;
  } catch (err) {
    return "";
  }
};

export const getSubstring = (str: string, length: number) => {
  if (isString(str)) {
    return str.substring(0, length);
  }
  return str;
};
export const genUrlByQuery = (
  url: string,
  parameter: ApisBaseDataItem[] | undefined,
  query_add_equal: CustomNumberBooleanType | undefined = 1,
): string => {
  let paramsStr = "";
  let newUrl = url || "";

  const handleEncode = (value: string | undefined = "") => {
    let _value = cloneDeep(value);

    try {
      // Encode # symbol
      _value = _value.replace(/#/g, encodeURIComponent("#"));
      // Encode & symbol
      _value = _value.replace(/&/g, encodeURIComponent("&"));
    } catch (e) {}

    return _value;
  };

  forEach(parameter, (item: ApisBaseDataItem) => {
    if (item.key && isEqual(item.is_checked, STATUS_CODE.ENABLE)) {
      paramsStr += `${paramsStr ? "&" : ""}${handleEncode(item.key)}${
        isEqual(query_add_equal, STATUS_CODE.DISABLE) && !item.value ? "" : "="
      }${handleEncode(item.value)}`;
    }
  });

  // NOTE If original url has hash, need to append it back
  newUrl = `${head(newUrl.split("?"))}${paramsStr ? "?" : ""}${paramsStr}${
    urlParse(newUrl)?.hash || ""
  }`;

  return newUrl;
};

export const getHistoryOpensData = (value: any) => {
  const dataNew = cloneDeep(value);
  dataNew.id = snowflakeId();
  dataNew.is_changed = 1;
  dataNew.sort = 0;
  dataNew.is_locked = -1;
  dataNew.version = 0;
  delete dataNew?.history_id;
  return dataNew;
};

export const getCollectionServerId = (
  id: string,
  parents_data: any,
  defaultServerId?: string,
): string => {
  const result = ""; // Use default by default
  // If unsaved, need to get from opens
  const targetInfo = parents_data?.[id];

  if (isUndefined(targetInfo)) {
    return defaultServerId || result;
  }

  if (isString(targetInfo?.server_id) && !isEqual(targetInfo?.server_id, "0")) {
    return targetInfo.server_id;
  }

  return getCollectionServerId(
    targetInfo.parentId,
    parents_data,
    defaultServerId,
  );
};

export const getParameterDataFilterContentLength = (
  oldParameter: Array<ApisBaseDataItem>,
) => {
  const result = produce(oldParameter, (draft) => {
    return filter(
      draft,
      (item) => !isEqual(toUpper(item.key), "CONTENT-LENGTH"),
    );
  });

  return result;
};
/** Socket transport ancestry; HTTP requests are not converted into another schema. */
export type SocketCollectionItem = Pick<
  ApiDetailsData,
  "id" | "parentId" | "kind" | "name" | "server_id"
> & {
  request?:
    | import("@onapi/http-model/requests/types/websocket").WebSocketRequest
    | import("@onapi/http-model/requests/types/socketio").SocketIoRequest;
};
export const getSocketCollection = async (
  target: SocketCollectionItem,
  items: Pick<
    ApiDetailsData,
    "id" | "parentId" | "kind" | "name" | "server_id"
  >[],
  temporaryServerId?: string,
): Promise<SocketCollectionItem[]> => {
  const origin = structuredClone(target);
  if (temporaryServerId) {
    origin.server_id = temporaryServerId;
  }
  const result: SocketCollectionItem[] = [origin];
  const byId = new Map(items.map((item) => [item.id, item]));
  const seen = new Set([target.id]);
  let parent = byId.get(target.parentId);
  while (parent && !seen.has(parent.id)) {
    seen.add(parent.id);
    result.push({
      id: parent.id,
      parentId: parent.parentId,
      kind: parent.kind,
      name: parent.name,
      server_id: parent.server_id,
    });
    parent = byId.get(parent.parentId);
  }
  return result;
};

export const createTargetIdMap = (
  collection: SocketCollectionItem[],
  serverList: ServerItem[] = [],
) => {
  const targetIdMap = new Map();
  let default_pre_url = "";
  let defaultServer = serverList.find((item) => item.is_default === 1);
  // Fallback. If serverList is empty, use the first server by default
  if (!defaultServer && serverList.length > 0) {
    defaultServer = serverList[0];
  }
  if (defaultServer) {
    default_pre_url = defaultServer.uri;
  }

  collection.forEach((item) => {
    const newItem = {
      id: item?.id,
      kind: item?.kind,
      parentId: item?.parentId,
      name: item?.name,
      request: {
        ...item?.request,
      },
      parents: [],
      server_id: item?.server_id,
      ...(item?.kind === APIS_TARGET_TYPE_ENUM.FOLDER && {
        server_id: item?.server_id,
      }),
    };
    targetIdMap.set(item.id, newItem);
  });

  targetIdMap.forEach((item) => {
    let server_id = item?.server_id;
    item.pre_url = default_pre_url;
    if (item.parentId && item.parentId !== "0") {
      const parents: any = [];
      let currentParentId = item.parentId;

      // Get all parent elements
      while (
        currentParentId &&
        currentParentId !== "0" &&
        targetIdMap.has(currentParentId)
      ) {
        const parentItem = targetIdMap.get(currentParentId);
        if (!parentItem) {
          break;
        }
        if (parentItem.server_id && parentItem.server_id != "0" && !server_id) {
          server_id = parentItem.server_id;
        }
        if (!parents.some((parent: any) => parent.id === parentItem.id)) {
          parents.push({
            id: parentItem.id,
            kind: parentItem.kind,
            ...(parentItem.server_id &&
              parentItem.server_id !== "0" && {
                server_id: parentItem.server_id,
              }),
          });
        }
        currentParentId = parentItem.parentId; // Update to next parent element's parentId
      }

      // Add parents property to item
      item.parents = parents;
    }
    if (server_id) {
      item.server_id = server_id;
      const serverItem = serverList.find(
        (item2) => item2.server_id === server_id,
      );
      if (serverItem) {
        item.pre_url = serverItem.uri;
      }
    }
  });

  return targetIdMap;
};
