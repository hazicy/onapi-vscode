import { ApisBaseDataItem } from "@onapi/domain/requests/types/base";
import { RequestBodyContentType } from "@onapi/domain/requests/types/request";
import { CustomNumberBooleanType } from "@onapi/domain/types/common";
import { GlobalParamsHeaderItem } from "@onapi/domain/project/types/index";

export type Item = {
  description: string;
  field_type: string;
  is_checked: -1 | 1;
  key: string;
  value: string;
  not_null: -1 | 1;
  type?: string;
  id: number;
};

export type ItemProps = {
  rowData: ApisBaseDataItem;
  rowIndex: number;
  readOnly?: boolean;
  tabType?: RequestTableProps["tabType"];
  bodyMode?: RequestTableProps["bodyMode"];
  setSelectedRowKeys?: (keys: string[]) => void;
  onChange?: (rowIndex: number, rowData: ApisBaseDataItem) => void;
  onDelete?: (rowIndex: number) => void;
  valueSuffix?: boolean;
};

export interface RequestTableProps {
  dataSource: ApisBaseDataItem[];
  globalParams?: GlobalParamsHeaderItem[];
  folderParams?: ApisBaseDataItem[];
  queryAddEqual?: CustomNumberBooleanType;
  paramsType?: "global" | "folder" | "request" | "";
  tabType?:
    | "header"
    | "query"
    | "restful"
    | "body"
    | "cookie"
    | "event"
    | "socketio";
  readOnly?: boolean;
  bodyMode?: RequestBodyContentType;
  isSystem?: boolean;
  showAiDescription?: boolean;
  onChange: (params: ApisBaseDataItem[]) => void;
  onChangeQueryAddEqual?: (params: CustomNumberBooleanType) => void;
  columnSwitchConfig?: TableColumnSwitchConfig;
  onColumnSwitchConfig?: (params: TableColumnSwitchConfig) => void;
  showDelete?: boolean;
  kind?: string;
}

/**Table column configuration items */
export type TableColumnSwitchConfig = {
  /**Parameter description toggle */
  parameter_description: CustomNumberBooleanType;
  /**Parameter type toggle */
  parameter_type: CustomNumberBooleanType;
  /**Content type toggle */
  content_type: CustomNumberBooleanType;
};
