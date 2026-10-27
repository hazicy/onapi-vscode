import { APIS_TARGET_TYPE_ENUM } from "@onapi/http-model/requests/constants/index";

export const DEFAULT_NO_DRAG_INCLUDES_KEYS = [
  "tree-top-node-wrap",
  "tree-bottom-node-key",
] as const;

export enum DROP_POSITION_ENUM {
  INSIDE = 0,
  TOP = -1,
  BOTTOM = 1,
}

export const DEFAULT_CALC_CHILDREN_COUNT_TYPES = [
  APIS_TARGET_TYPE_ENUM.FOLDER,
  APIS_TARGET_TYPE_ENUM.SOCKET,
  APIS_TARGET_TYPE_ENUM.API_SAMPLE_GROUP,
];
