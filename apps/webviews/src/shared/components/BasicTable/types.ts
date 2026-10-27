import type {
  TableProps as BaseTableProps,
  SelectProps,
  TableColumnType,
} from "@/shared/ui/base";

import type { DragEndEvent } from "@dnd-kit/core";

import { COMPARE_METHODS } from "./constants";

export type FilterOption = {
  /**key of label, corresponding one-to-one with columns */
  key: string;
  /**filter values */
  values: SelectProps["options"];
  /**key for value extraction */
  getKey: string;
  /**match key, e.g. filter is create_user.nickname, match needs uid, required for secondary lookup, not needed in normal cases */
  matchKey?: string;
  /**comparison method */
  compareMethod?: COMPARE_METHODS;
};

export type ToolbarConfig = {
  search?: {
    onSearch: (value: string) => void;
    /**search placeholder */
    placeholder?: string;
  };
  filter?: {
    filterOptionList: FilterOption[];
    onFilter: (newDataSource: any[]) => void;
  };
  share?: {
    /**share callback */
    onShare: () => void;
  };
  refresh?: {
    /**refresh callback */
    onRefresh: () => void;
  };
  del?: {
    /**delete callback */
    onDelete?: () => Promise<void>;
  };
  updateStatus?: {
    /**update status dropdown options */
    statusOptions: SelectProps["options"];
    /**change status callback */
    onUpdateStatus: (value: string) => Promise<void>;
  };
  tag?: {
    /**add tag dropdown options */
    tagOptions: SelectProps["options"];
    /**delete tag dropdown options */
    tagDelOptions: SelectProps["options"];
    /**change tag callback */
    onUpdateTag: (values: string[], type: TagType) => void;
  };
  exp?: {
    /**export callback */
    onExport?: ({
      exportType,
      version,
    }: {
      [k: string]: string;
    }) => Promise<void>;
  };
  move?: {
    /**move options */
    moveOptions: SelectProps["options"];
    /**move callback */
    onMove: (value: string) => Promise<void>;
    /**custom field names */
    fieldNames: {
      label: string;
      value: string;
      children: string;
    };
  };
  setting?: {
    prohibitModifyColumns?: string[];
    /**display columns */
    checkedList: string[];
    /**modify */
    onChange: (checkedList: string[]) => void;
    /**sort columns */
    onColumnsSort: (columns: any[]) => void;
  };
};

export type ColumnsType<DataSource> = TableColumnType<DataSource>;

export type TableProps<DataSource> = {
  /**original DataSource */
  originDataSource?: DataSource[];
  /**columns */
  columns?: ColumnsType<DataSource>[];
  /**filter */
  toolbar?: ToolbarConfig;
  /*whether to reset padding */
  resetPadding?: boolean;
  /**whether to support column resizing */
  resizableColEnable?: boolean;
} & BaseTableProps<DataSource>;

export type BasicTableProps<DataSource> = {
  /**whether drag is supported */
  dragEnable?: boolean;
  /**disable drag for first item */
  dragFirstDisabled?: boolean;
  /**disable drag for last item */
  dragLastDisabled?: boolean;
  /**drag end callback */
  onDragEnd?: (event: DragEndEvent) => void;
  /**cell padding */
  cellPadding?: number;
} & TableProps<DataSource>;

export type AnyObject = Record<string, any>;

export type ToolbarProps<DataSource> = ToolbarConfig & TableProps<DataSource>;

export enum TagType {
  Add = "add",
  REMOVE = "remove",
}
