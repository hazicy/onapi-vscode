import { snowflakeId } from "@onapi/domain/utils/data-tools";
import { includes, isPlainObject, isString, toString, trim } from "lodash-es";

// Handle websocket data
export const handleSocketResponse = (
  response: any[],
  filterValue?: string,
  filterType?: string,
) => {
  const resArr: any[] = [];

  for (const res of response || []) {
    if (
      isString(filterType) &&
      filterType !== "all" &&
      res?.action !== filterType
    ) {
      continue;
    }

    switch (res?.action) {
      case "connect":
        {
          if (
            isString(filterValue) &&
            trim(filterValue).length > 0 &&
            !includes(res?.message?.message, trim(filterValue))
          ) {
            continue;
          }
          resArr.push({
            ...res,
            id: res?.id || snowflakeId(),
          });
        }
        break;
      case "disconnect":
        if (
          isString(filterValue) &&
          trim(filterValue).length > 0 &&
          !includes(res?.message, trim(filterValue))
        ) {
          continue;
        }
        resArr.push({
          ...res,
          id: res?.id || snowflakeId(),
        });
        break;
      case "error":
        if (
          isString(filterValue) &&
          trim(filterValue).length > 0 &&
          !includes(res?.message?.message, trim(filterValue))
        ) {
          continue;
        }

        resArr.push({
          ...res,
          id: res?.id || snowflakeId(),
        });
        break;
      case "message":
        if (
          isString(filterValue) &&
          trim(filterValue).length > 0 &&
          !includes(res?.message?.data, trim(filterValue))
        ) {
          continue;
        }

        resArr.push({
          ...res,
          id: res?.id || snowflakeId(),
        });
        break;
      case "send":
        if (
          isString(filterValue) &&
          trim(filterValue).length > 0 &&
          !includes(getSendStr(res?.message?.message?.data), trim(filterValue))
        ) {
          continue;
        }

        resArr.push({
          ...res,
          id: res?.id || snowflakeId(),
        });
        break;
      case "listen":
        if (
          isString(filterValue) &&
          trim(filterValue).length > 0 &&
          !includes(res?.message, trim(filterValue))
        ) {
          continue;
        }
        resArr.push({
          ...res,
          id: res?.id || snowflakeId(),
        });
        break;
      case "listen-end":
        if (
          isString(filterValue) &&
          trim(filterValue).length > 0 &&
          !includes(res?.message, trim(filterValue))
        ) {
          continue;
        }
        resArr.push({
          ...res,
          id: res?.id || snowflakeId(),
        });
        break;
      case "send_ack":
        if (
          isString(filterValue) &&
          trim(filterValue).length > 0 &&
          !includes(getSendStr(res?.message?.message?.data), trim(filterValue))
        ) {
          continue;
        }
        resArr.push({
          ...res,
          id: res?.id || snowflakeId(),
        });
        break;
      default:
        break;
    }
  }

  return resArr;
};

export const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let r = 0,
    g = 0,
    b = 0;
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    if (i === 0) {
      r = value;
    }
    if (i === 1) {
      g = value;
    }
    if (i === 2) {
      b = value;
    }
  }

  // Ensure at least two components are not less than 80
  const minComponentValue = 100;
  const components = [r, g, b];
  const belowThreshold = components.filter(
    (value) => value < minComponentValue,
  ).length;

  if (belowThreshold > 1) {
    // Sort components in ascending order
    components.sort((a, b) => a - b);

    // Increase the two smallest components to at least 80
    components[0] = Math.max(minComponentValue, components[0]);
    components[1] = Math.max(minComponentValue, components[1]);

    // Assign back to r, g, b
    [r, g, b] = components;
  }

  // Ensure the color is in the middle brightness range
  const minBrightness = 50;
  const maxBrightness = 100;
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  if (brightness < minBrightness / 255) {
    const scale = minBrightness / (brightness * 255);
    r = Math.min(255, Math.round(r * scale));
    g = Math.min(255, Math.round(g * scale));
    b = Math.min(255, Math.round(b * scale));
  } else if (brightness > maxBrightness / 255) {
    const scale = maxBrightness / (brightness * 255);
    r = Math.max(0, Math.round(r * scale));
    g = Math.max(0, Math.round(g * scale));
    b = Math.max(0, Math.round(b * scale));
  }

  // Ensure no single component is too low or too high
  const minComponent = 50;
  const maxComponent = 225;
  r = Math.max(minComponent, Math.min(maxComponent, r));
  g = Math.max(minComponent, Math.min(maxComponent, g));
  b = Math.max(minComponent, Math.min(maxComponent, b));

  const color = `#${("00" + r.toString(16)).substr(-2)}${("00" + g.toString(16)).substr(-2)}${(
    "00" + b.toString(16)
  ).substr(-2)}`;

  return color;
};

export const getSendStr = (data: any) => {
  if (isString(data)) {
    return data;
  }
  if (isPlainObject(data)) {
    return JSON.stringify(data);
  }
  return toString(data);
};
