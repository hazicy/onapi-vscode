import type { ApisBaseDataItem } from "@onapi/domain/requests/types/base";
import { isURL, getUrlQueryToArray, createUrl } from "@/shared/utils/common";
import { filter, forEach, isEqual } from "lodash-es";
import urlParse from "url-parse";
import { STATUS_CODE } from "@onapi/domain/constants/common";
import { snowflakeId } from "@onapi/domain/utils/data-tools";

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
