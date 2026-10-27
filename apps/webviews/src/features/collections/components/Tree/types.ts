import { DEFAULT_API_MARK_ENUM } from "@onapi/http-model/requests/constants/index";

export type TreeDataFilterParams = {
  value: string;
  mark_id: DEFAULT_API_MARK_ENUM;
};

import type { DataNode } from "@/shared/ui/base";
import type { TreeDataItem } from "@onapi/http-model/requests/types/api";

/** Presentation nodes retain source metadata separately from their rendered title. */
export type CollectionTreeNode = DataNode & { data?: TreeDataItem };
