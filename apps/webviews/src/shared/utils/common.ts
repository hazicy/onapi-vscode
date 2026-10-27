import { getUpwardFolderId, getSubstring } from "@onapi/domain/request-utils";
import {
  COLLECTION_TIPS,
  ICONS_MAP,
  REGULAR_TIPS,
  VARIABLE_TIPS,
} from "@onapi/domain/constants/common";
import {
  array2Tree,
  getUrlQueryArray,
  isJson,
} from "@onapi/domain/utils/data-tools";
import i18next from "i18next";
import { divide, format, round } from "mathjs/number";
import FileSaver from "file-saver";
import {
  concat,
  countBy,
  forEach,
  includes,
  isArray,
  isObject,
  isPlainObject,
  isString,
  size,
  toUpper,
  trim,
} from "lodash-es";
import { ComponentType } from "react";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";
import {
  ApisBaseData,
  ApisBaseDataItem,
} from "@onapi/domain/requests/types/base";
/**
 * Convert hex color to RGBA color string
 * @param hex - Hex color value
 * @param alpha - Opacity, default is 1
 * @returns String composed of RGBA
 */
export const hexToRGBA = (hex: string, alpha: number = 1) => {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
};

// DataIcon function now uses a mapping to find the corresponding component
export const getBaseIconOfTargetType = (kind: string): any => {
  const IconComponentInfo = ICONS_MAP[kind];
  if (IconComponentInfo) {
    return IconComponentInfo;
  } else {
    return ICONS_MAP["api"];
  }
};

/**
 * Keep two decimal places
 */
export const toFixed = (number: number) => {
  return number.toFixed(2);
};

// Copy text to clipboard
export const copyStringToClipboard = (
  str: string,
  onSuccess?: () => void,
  onError?: () => void,
) => {
  const clipboardObj = navigator.clipboard;
  // If Clipboard object is not supported, report error directly
  if (clipboardObj) {
    // Write content to clipboard
    clipboardObj.writeText(str).then(
      () => {
        onSuccess && onSuccess();
      },
      () => {
        try {
          const textarea = document.createElement("textarea");
          document.body.appendChild(textarea);
          // Hide this input box
          textarea.style.position = "fixed";
          textarea.style.clip = "rect(0 0 0 0)";
          textarea.style.top = "10px";
          // Assign value
          textarea.value = str;
          // Select
          textarea.select();
          // Copy
          document.execCommand("copy", true);
          // Remove input box
          document.body.removeChild(textarea);
        } catch (error) {
          onError && onError();
        }
      },
    );
  } else {
    try {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      // Hide this input box
      textarea.style.position = "fixed";
      textarea.style.clip = "rect(0 0 0 0)";
      textarea.style.top = "10px";
      // Assign value
      textarea.value = str;
      // Select
      textarea.select();
      // Copy
      document.execCommand("copy", true);
      // Remove input box
      document.body.removeChild(textarea);
      if (str) {
        onSuccess && onSuccess();
      }
    } catch (error) {
      onError && onError();
    }
  }
};

export const getSize = (value: any) => {
  if (isString(value)) {
    return new Blob([value]).size;
  } else if (value instanceof Blob) {
    return value.size;
  } else if (value instanceof ArrayBuffer) {
    return value.byteLength;
  } else if (isObject(value)) {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch (e) {
      return 0;
    }
  }
  return 0;
};

export const TEN_MB = 5 * 1024 * 1024;

/**
 * Check if it is a valid URL
 * @param url String
 * @return {Boolean}
 */
export const isURL = (_url: string) => {
  if (!_url) {
    return false;
  }
  _url = trim(_url);
  return (
    _url.substr(0, 7).toLowerCase() === "http://" ||
    _url.substr(0, 8).toLowerCase() === "https://"
  );
};

export const getUrlQueryToArray = (url: string) => {
  return getUrlQueryArray(url);
};

/**
 * Create URL object
 * @param _url String
 * @return {URLObj}
 */
export const createUrl = (_url: any): any => {
  if (typeof _url !== "string") {
    _url += "";
  }
  if (!isURL(_url)) {
    _url = `http://${_url}`;
  }

  // eslint-disable-next-line no-useless-escape
  const hostReg = /(http([s]?):\/\/)([^\/\?\\#]*)([\/|\?|\\#]?)/i;
  const host_arr = _url.match(hostReg);
  const protocol = host_arr[1];
  const host = host_arr[3];

  // Domain part
  const origin = protocol + host;

  // Remaining part
  _url = `https://www.apipost.cn${_url.substring(origin.length)}`;

  let urls = {};
  try {
    urls = new URL(_url);
  } catch {
    const http_url = `https://www.apipost.cn${_url.substring(origin.length)}`;
    const a = document.createElement("a");
    a.href = http_url;
    urls = {
      source: _url,
      href: a.href,
      protocol: a.protocol,
      host: a.hostname,
      hostname: a.hostname,
      port: a.port,
      origin: a.origin,
      search: a.search,
      pathname: a.pathname,
      // eslint-disable-next-line no-useless-escape
      file: (a.pathname.match(/\/([^\/?#]+)$/i) || ["", ""])[1],
      hash: a.hash,
    };
  }
  return urls;
};

// Calculate tab line component header parameter count, and remove empty key parameters
export const calcTabLineBodyHeaderNum = function (params: any) {
  let countNum = 0;

  if (isArray(params)) {
    countNum = countBy(params, function (item) {
      return item.key != "" ? 1 : 0;
    })[1];
  } else if (isObject(params as any)) {
    switch (params?.mode) {
      case "none":
        countNum = 0;
        break;
      case "urlencoded":
      case "form-data":
        countNum = countBy(params?.parameter, function (item) {
          return item.key != "" ? 1 : 0;
        })[1];
        break;
      default:
        countNum = 1;
        break;
    }
  }

  return countNum;
};

export const calcTabLineBodyNum = function (params: any) {
  let countNum = 0;

  if (isArray(params)) {
    countNum = countBy(params, function (item) {
      return item.key != "" ? 1 : 0;
    })[1];
  } else if (isObject(params as any)) {
    switch (params?.mode) {
      case "none":
        countNum = 0;
        break;
      case "urlencoded":
      case "form-data":
        countNum = countBy(params?.parameter, function (item) {
          return item.key != "" ? 1 : 0;
        })[1];
        break;
      default:
        countNum = 0;
        break;
    }
  }

  return countNum;
};

/**
 * Get compareType tip
 */

export const getCompareTypeTip = (compareType: string) => {
  if (includes(VARIABLE_TIPS, compareType)) {
    return i18next.t("common.assertion.expression.input_value");
  }
  if (includes(REGULAR_TIPS, compareType)) {
    return i18next.t("common.assertion.expression.regex_tip");
  }
  if (includes(COLLECTION_TIPS, compareType)) {
    return i18next.t("common.assertion.expression.select_value");
  }
  return "";
};

export const download = async (data: any, name: string, type: string) => {
  if (!data) {
    return;
  }

  let saveAsData = data;

  if (
    isPlainObject(saveAsData) &&
    Object.prototype.hasOwnProperty.call(saveAsData, "data")
  ) {
    saveAsData = new Int8Array(saveAsData.data);
  }

  saveAsData = new Blob([saveAsData], {
    type: isString(type) ? type : "application/zip",
  });

  FileSaver.saveAs(saveAsData, name);
};

export const arrayToTreeObject = (
  arr: Array<any>,
  idName = "id",
  pidName = "parentId",
) => {
  return array2Tree(arr, idName, pidName);
};

export const flatTreeItems = (nodes: any[] = [], sortFn: any) => {
  const nodeList: any[] = [];
  if (sortFn !== undefined) {
    nodes.sort(sortFn);
  }
  const dig = (childList: any[] = [], level: any) => {
    childList.forEach((item: any) => {
      nodeList.push({ ...item, level });

      const childItemList = item.children;
      if (sortFn !== undefined && childItemList !== undefined) {
        childItemList.sort(sortFn);
      }
      dig(childItemList, level + 1);
    });
  };
  dig(nodes, 1);
  return nodeList;
};

/**
 * import Delayed import
 */
export const importDelay = (
  promise: Promise<{
    default: ComponentType<any>;
  }>,
  ms: number = 0,
): Promise<{
  default: ComponentType<any>;
}> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(promise);
    }, ms);
  });
};

export const sizeFormat = (size: number | string | undefined): string => {
  if (isString(size)) {
    return size;
  }
  // Check if input is a valid number
  if (typeof size !== "number" || isNaN(size) || !isFinite(size)) {
    return "-";
  }

  // Handle special cases: for 0 and negative numbers, return clear message
  if (size <= 0) {
    return size === 0 ? "0B" : "-";
  } else {
    // Pre-calculate powers to avoid repeated calculation and improve performance
    const powersOf1024 = [1, 1024, Math.pow(1024, 2), Math.pow(1024, 3)];
    let exponent = 0;

    // Find appropriate power
    while (size >= powersOf1024[++exponent]) {}

    // Use template string and abstract function to simplify code
    return formatSize(size / powersOf1024[exponent - 1], exponent - 1);
  }
};

export const formatSize = (size: number, exponent: number): string => {
  // Select unit based on exponent
  const units = ["B", "KB", "MB", "GB"];
  return `${parseFloat(size.toFixed(2))}${units[exponent]}`;
};

export const isJSON = isJson;

// Flow test select file (if string is csv, return a promise object, otherwise return a normal array object)
export const str2testData = async (_str: string) => {
  let returnList = [];
  let jsonObj: any;

  if (!isJSON(_str)) {
    const { default: csvToJson } = await import("csvtojson");
    returnList = await csvToJson().fromString(_str);
  } else {
    jsonObj = JSON.parse(_str);
    if (jsonObj instanceof Array) {
      returnList = jsonObj;
    } else {
      for (const key in jsonObj) {
        if (!isString(jsonObj[key])) {
          jsonObj[key] = "";
        }
      }
      returnList.push(jsonObj);
    }
  }
  return returnList;
};

export const getSafeJSON = (text: any) => {
  try {
    const data = JSON.parse(text);
    return data;
  } catch (ex) {
    return null;
  }
};

export const convertVarFormat = (v: any) => {
  try {
    if (isObject(v)) {
      return JSON.stringify(v);
    }
    return String(v);
  } catch (err) {
    return String(v);
  }
};

export const areKeysOneToOne = (
  array1: Array<ApisBaseDataItem>,
  array2: Array<ApisBaseDataItem>,
) => {
  // Create two Map objects to store key and value from each array
  const map1 = new Map(array1.map((item) => [item.key, item?.value]));
  const map2 = new Map(array2.map((item) => [item.key, item?.value]));

  // Check if the two maps have the same size
  if (map1.size !== map2.size) {
    return false;
  }

  // Check if each key matches exactly
  for (const [key, value] of map1) {
    if (!map2.has(key)) {
      return false;
    }
  }

  return true;
};

// Conversion function Build directory tree
export const convertToSaveFolderTree = (data: { [k: string]: any }) => {
  const jsonData: any = {};
  forEach(data, (it) => {
    if (it?.kind === "folder") {
      jsonData[it.id] = it;
    }
  });

  const result = [];
  const map: any = {};

  // Build mapping
  for (const key in jsonData) {
    map[key] = { ...jsonData[key], children: [] };
  }

  // Build tree structure
  for (const key in map) {
    const item = map[key];
    if (item.parentId !== "0") {
      map[item.parentId]?.children?.push(item);
    } else {
      result.push(item);
    }
  }

  // Remove unnecessary properties and convert format
  function traverse(node: any) {
    const { id, name, children } = node;
    const newNode: any = { label: name, key: id };
    if (children.length > 0) {
      newNode.children = children.map(traverse);
    }
    return newNode;
  }

  return concat([{ label: i18next.t("root"), key: "0" }], result.map(traverse));
};

// Get all parent directories
export const getAllParentDirectories = (
  jsonData: { [k: string]: ApisBaseData },
  targetId: string,
) => {
  const allParents: ApisBaseData[] = [];

  function getParent(directoryId: string) {
    const directory = jsonData[directoryId];
    if (!directory) {
      return;
    }

    const parentId = directory.parentId;
    if (parentId !== "0") {
      const parentDirectory = jsonData[parentId];
      allParents.push(parentDirectory);
      getParent(parentId);
    }
  }

  getParent(targetId);

  return allParents;
};

export const isAssertPass = (assert: any) => {
  if (isArray(assert)) {
    if (assert.length === 0) {
      return true;
    } else if (size(assert.filter((i) => i?.passed)) === size(assert)) {
      return true;
    }
  }

  if (isString(assert) && toUpper(assert) === "OK") {
    return true;
  }
  return false;
};

export const convertResponseTime = (responseTime: number | undefined) => {
  if (!responseTime) {
    return "0ms";
  }
  if (responseTime < 1000) {
    return `${responseTime}ms`;
  } else if (responseTime < 60000) {
    const time = format(round(divide(responseTime, 1000), 3)).toString();
    return `${time}s`;
  } else {
    const time = format(round(divide(responseTime, 60000), 3)).toString();
    return `${time}min`;
  }
};

export const isJSONString = (str: string): boolean => {
  try {
    const parsed = JSON.parse(str);
    return isPlainObject(parsed) && !isArray(parsed);
  } catch (err) {
    return false;
  }
};

const computedNumRound = (num: number | undefined) => {
  return round(num || 0, 2);
};

export const convertResponseBytes = (bytes: number) => {
  const KB = 1024;
  const MB = KB * 1024;

  let convertedValue;
  let unit;

  if (bytes >= MB) {
    convertedValue = computedNumRound(bytes / MB); // Convert to MB, keep two decimal places
    unit = "MB";
  } else if (bytes >= KB) {
    convertedValue = computedNumRound(bytes / KB); // Convert to KB, keep two decimal places
    unit = "KB";
  } else {
    convertedValue = bytes; // Keep byte count
    unit = "B";
  }

  return {
    originalValue: bytes,
    convertedValue: convertedValue, // Converted value
    unit: unit,
  };
};

export { getUpwardFolderId, getSubstring } from "@onapi/domain/request-utils";
