import type { EditorRecord as ApiDetailsData } from "@onapi/domain/requests/record";
import type { TabPaneProps } from "@/shared/ui/base";

export type PanelProps = {
  token?: Partial<GlobalThemeToken>;
  activeTab: string;
  setActiveTab?: (activeTab: string) => void;
  searchValue: string;
  setPlainOptions?: (option: any) => void;
  menuType: "history" | "share";
  shareList: Array<
    ApiDetailsData & {
      share_time: number;
    }
  >;
};
export type TabsProps = {
  listExtraContent: (id: string, item?: any) => React.ReactNode;
  controlExtraContent?: React.ReactNode;
  tabExtraContent?:
    | React.ReactNode
    | { left?: React.ReactNode; right?: React.ReactNode };
  lists?: any[];
  checkedList: any[];
  setCheckedList: (checkedList: any[]) => void;
  fieldKey?: string;
} & Omit<PanelProps, "token">;

export interface Tab extends Omit<TabPaneProps, "tab"> {
  key: string | string[];
  label: React.ReactNode;
}

export type ListsProps = {
  activekey: string | string[];
} & TabsProps;
