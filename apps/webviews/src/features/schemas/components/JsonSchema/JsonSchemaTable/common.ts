import { isArray, isUndefined } from "lodash";

// Get object type
export const getItemType = (
  props:
    | {
        type?: string | string[];
        oneOf?: unknown;
        anyOf?: unknown;
        allOf?: unknown;
      }
    | undefined,
) => {
  if (isArray(props?.type)) {
    if (props.type.length > 2) {
      return "other";
    }
    return props.type?.[0] ?? "";
  }

  if (!isUndefined(props?.type)) {
    return props.type;
  }
  if (!isUndefined(props?.oneOf)) {
    return "oneOf";
  }
  if (!isUndefined(props?.anyOf)) {
    return "anyOf";
  }
  if (!isUndefined(props?.allOf)) {
    return "allOf";
  }
  return "";
};
