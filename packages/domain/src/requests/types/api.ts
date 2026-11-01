import type { CustomNumberBooleanType } from "@onapi/domain/types/common";
import type { ApisBaseData } from "@onapi/domain/requests/types/base";

// Tree directory item generated from base data
export type TreeDataItem = Pick<
  ApisBaseData,
  "id" | "kind" | "name" | "sort" | "mark_id" | "status" | "method" | "parentId"
> & {
  method: string;
  url: string;
  is_locked: -1 | 1;
  is_exampled: CustomNumberBooleanType;
  sample_group_id?: string;
  origin_parentId?: string;
  children?: Array<TreeDataItem>;
  [x: string]: any;
};
