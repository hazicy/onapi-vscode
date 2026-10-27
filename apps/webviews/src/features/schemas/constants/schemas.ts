import { TYPE_DATA_KEYS } from "@/features/schemas/types";

export const DIFF_DATA_KEYS: Partial<TYPE_DATA_KEYS> = {
  parentId: "parentId",
  model_type: "model_type",
  name: "name",
  display_name: "display_name",
  description: "description",
  schema: "schema",
  sort: "sort",
};

export enum SCHEMAS_MODEL_TYPE_ENUM {
  MODEL = "model",
}

export const SCHEMAS_DEFAULT_DATA = {
  type: "object",
  properties: {},
};
