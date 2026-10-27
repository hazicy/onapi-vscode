export interface DataNode {
  key: React.Key;
  title?: React.ReactNode;
  children?: DataNode[];
  isLeaf?: boolean;
  disabled?: boolean;
  disableCheckbox?: boolean;
  selectable?: boolean;
  checkable?: boolean;
  [key: string]: any;
}
export type TreeEventNode<T = DataNode> = T & {
  key: React.Key;
  pos: string;
  expanded: boolean;
  selected: boolean;
  checked: boolean;
};
export interface TreeProps<T = DataNode> {
  treeData?: T[];
  fieldNames?: { key?: string; title?: string; children?: string };
  selectedKeys?: React.Key[];
  defaultSelectedKeys?: React.Key[];
  expandedKeys?: React.Key[];
  defaultExpandedKeys?: React.Key[];
  defaultExpandAll?: boolean;
  checkedKeys?:
    | React.Key[]
    | { checked: React.Key[]; halfChecked: React.Key[] };
  defaultCheckedKeys?: React.Key[];
  checkable?: boolean;
  checkStrictly?: boolean;
  selectable?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  loadData?: (node: TreeEventNode<T>) => Promise<unknown>;
  onSelect?: (
    keys: React.Key[],
    info: {
      node: TreeEventNode<T>;
      selected: boolean;
      selectedNodes: T[];
      nativeEvent: React.SyntheticEvent;
    },
  ) => void;
  onExpand?: (
    keys: React.Key[],
    info: {
      node: TreeEventNode<T>;
      expanded: boolean;
      nativeEvent?: React.SyntheticEvent;
    },
  ) => void;
  onCheck?: (
    keys: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] },
    info: {
      node: TreeEventNode<T>;
      checked: boolean;
      checkedNodes: T[];
      halfCheckedKeys: React.Key[];
      nativeEvent: Event;
    },
  ) => void;
  draggable?:
    | boolean
    | { icon?: React.ReactNode | false; nodeDraggable?: (node: T) => boolean }
    | ((node: T) => boolean);
  allowDrop?: (info: {
    dropNode: TreeEventNode<T>;
    dragNode: TreeEventNode<T>;
    dropPosition: number;
  }) => boolean;
  onDrop?: (info: {
    node: TreeEventNode<T>;
    dragNode: TreeEventNode<T>;
    dropPosition: number;
    dropToGap: boolean;
    event: React.DragEvent;
  }) => void;
  onDragOver?: (info: {
    node: TreeEventNode<T>;
    event: React.DragEvent;
  }) => void;
  titleRender?: (node: T) => React.ReactNode;
  [key: string]: any;
}
export interface TreeHandle {
  scrollTo: (options: { key: React.Key }) => void;
}
export type { ThemeConfig } from "./Theme";
export type { DrawerProps } from "../Drawer";
export type GetProps<T> = T extends React.ComponentType<infer P> ? P : never;
export interface UIProps {
  children?: React.ReactNode;
  className?: string;
  rootClassName?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onClick?: (...args: any[]) => any;
  onChange?: (...args: any[]) => any;
  onBlur?: (...args: any[]) => any;
  onFocus?: (...args: any[]) => any;
  onKeyDown?: (...args: any[]) => any;
  onKeyUp?: (...args: any[]) => any;
  onMouseDown?: (...args: any[]) => any;
  onMouseUp?: (...args: any[]) => any;
  onMouseEnter?: (...args: any[]) => any;
  onMouseLeave?: (...args: any[]) => any;
  onOpenChange?: (...args: any[]) => any;
  onConfirm?: (...args: any[]) => any;
  onCancel?: (...args: any[]) => any;
  onSelect?: (...args: any[]) => any;
  onDeselect?: (...args: any[]) => any;
  onSearch?: (...args: any[]) => any;
  onExpand?: (...args: any[]) => any;
  onDropdownVisibleChange?: (...args: any[]) => any;
  onValuesChange?: (...args: any[]) => any;
  filterTreeNode?: boolean | ((input: string, node: any) => boolean);
  expandIcon?: (...args: any[]) => any;
  dropdownRender?: (...args: any[]) => any;
  popupRender?: (...args: any[]) => any;
  titleRender?: (...args: any[]) => any;
  getPopupContainer?: (...args: any[]) => any;
  onPressEnter?: (...args: any[]) => any;
  [prop: string]: any;
}
export interface Option extends UIProps {
  value?: string | number | boolean;
  label?: React.ReactNode;
  options?: Option[];
}
export interface ButtonProps extends UIProps {
  iconClassName?: string;
  type?: "default" | "primary" | "text" | "link" | "dashed";
  htmlType?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLElement>;
  loading?: boolean | { delay?: number };
}
export interface InputRef {
  input: HTMLInputElement | null;
  focus(options?: FocusOptions & { cursor?: "start" | "end" | "all" }): void;
  blur(): void;
  select(): void;
}
export interface InputProps extends UIProps {
  suffixClassName?: string;
  inputClassName?: string;
  affixClassName?: string;
  outlinedClassName?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onPressEnter?: React.KeyboardEventHandler<HTMLInputElement>;
}
export interface TextAreaProps extends UIProps {
  inputClassName?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  onPressEnter?: React.KeyboardEventHandler<HTMLTextAreaElement>;
}
export interface SelectProps<
  V = any,
  O extends Option = Option,
> extends UIProps {
  inputClassName?: string;
  triggerClassName?: string;
  arrowClassName?: string;
  optionClassName?: string;
  optionContentClassName?: string;
  indicatorClassName?: string;
  groupLabelClassName?: string;
  listClassName?: string;
  valueClassName?: string;
  popupClassName?: string;
  multipleClassName?: string;
  singleClassName?: string;
  outlinedClassName?: string;
  searchClassName?: string;
  popupArrow?: boolean;
  popupAnchor?: React.RefObject<HTMLElement | null>;
  popupSideOffset?: number;
  popupArrowStyle?: React.CSSProperties;
  options?: O[];
  value?: V;
  defaultValue?: V;
  onChange?: (value: V, option: O | O[]) => void;
  onSelect?: (value: any, option: O) => void;
  labelRender?: (props: {
    label: React.ReactNode;
    value: any;
  }) => React.ReactNode;
  optionRender?: (
    option: O & { data: O },
    info: { index: number },
  ) => React.ReactNode;
  filterOption?: boolean | ((input: string, option: O) => boolean);
  onSearch?: (text: string) => void;
  mode?: "multiple" | "tags";
}
export interface InputNumberProps<V = number> extends UIProps {
  inputClassName?: string;
  value?: V | null;
  defaultValue?: V;
  onChange?: (value: V | null) => void;
}
export interface CheckboxProps extends UIProps {
  controlClassName?: string;
  indicatorClassName?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  value?: any;
  onChange?: (event: CheckboxChangeEvent) => void;
}
export interface CheckboxChangeEvent {
  target: { checked: boolean; value?: any };
  nativeEvent: Event;
  stopPropagation(): void;
  preventDefault(): void;
}
export type RadioChangeEvent = CheckboxChangeEvent;
export type RadioProps = CheckboxProps;
export type RadioGroupProps = UIProps & {
  options?: (Option | string | number)[];
  value?: any;
  defaultValue?: any;
  onChange?: (e: RadioChangeEvent) => void;
};
export type SwitchProps = UIProps & {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, event: Event) => void;
};
export type MenuProps = UIProps & {
  itemClassName?: string;
  selectedItemClassName?: string;
  items?: MenuItemProps[];
  onClick?: (info: {
    key: string;
    domEvent: React.MouseEvent;
    keyPath: string[];
  }) => void;
};
export interface MenuItemProps extends Omit<UIProps, "children"> {
  key?: React.Key;
  label?: React.ReactNode;
  type?: string;
  onClick?: MenuProps["onClick"];
  children?: MenuItemProps[] | null;
}
export type ItemType = MenuItemProps;
export type TooltipProps = UIProps & {
  overlayClassName?: string;
  title?: React.ReactNode | (() => React.ReactNode);
};
export type PopoverProps = TooltipProps & {
  content?: React.ReactNode | (() => React.ReactNode);
};
export type DropdownProps = UIProps & {
  menu?: MenuProps;
  overlayClassName?: string;
  itemClassName?: string;
  selectedItemClassName?: string;
};
export type CollapseProps = UIProps & {
  itemClassName?: string;
  headerClassName?: string;
  triggerClassName?: string;
  panelClassName?: string;
  contentClassName?: string;
  items?: (UIProps & { key?: React.Key; label?: React.ReactNode })[];
};
export type TabsProps = UIProps & {
  navClassName?: string;
  navWrapClassName?: string;
  tabListClassName?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  tabButtonClassName?: string;
  contentClassName?: string;
  panelsClassName?: string;
  panelClassName?: string;
  items?: (UIProps & { key: string; label: React.ReactNode })[];
};
export type TabPaneProps = UIProps & {
  tab?: React.ReactNode;
  tabKey?: string;
  tabExtra?: React.ReactNode;
};
export type SegmentedProps<V = string | number> = UIProps & {
  listClassName?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  labelClassName?: string;
  options?: (Option | V)[];
  value?: V;
  onChange?: (
    value: V,
    label?: React.ReactNode,
    extra?: { triggerNode?: DataNode; clear?: boolean },
  ) => void;
};
export type SkeletonProps = UIProps;
export type TagProps = UIProps;
export type AlertProps = UIProps;
export type EmptyProps = UIProps & {
  imageClassName?: string;
  descriptionClassName?: string;
  footerClassName?: string;
};
export interface TreeSelectProps<V = any> extends UIProps {
  onChange?: (
    value: V,
    label?: React.ReactNode,
    extra?: { triggerNode?: DataNode; clear?: boolean },
  ) => void;
  value?: V;
  treeData?: any[];
  fieldNames?: { label?: string; value?: string; children?: string };
  treeTitleRender?: (node: any) => React.ReactNode;
  filterTreeNode?: boolean | ((input: string, node: any) => boolean);
}
export interface TableColumnType<T = any> extends Omit<UIProps, "children"> {
  key?: React.Key;
  title?: React.ReactNode | ((props: any) => React.ReactNode);
  dataIndex?: string | number | (string | number)[];
  render?: (value: any, record: T, index: number) => React.ReactNode;
  children?: TableColumnType<T>[];
}
export type TableColumnsType<T = any> = TableColumnType<T>[];
export type TableProps<T = any> = UIProps & {
  dataSource?: T[];
  columns?: TableColumnType<T>[];
  rowKey?: string | ((record: T, index: number) => React.Key);
  components?: any;
  rowSelection?: {
    selectedRowKeys?: React.Key[];
    defaultSelectedRowKeys?: React.Key[];
    onChange?(keys: React.Key[], rows: T[], info: any): void;
    renderCell?: (
      checked: boolean,
      record: T,
      index: number,
      node: React.ReactNode,
    ) => React.ReactNode;
    getCheckboxProps?: (record: T) => any;
    onSelect?: (record: T, selected: boolean, rows: T[]) => void;
    [key: string]: any;
  };
  pagination?:
    | false
    | {
        current?: number;
        pageSize?: number;
        total?: number;
        showTotal?: (total: number, range: [number, number]) => React.ReactNode;
        onChange?: (page: number, pageSize: number) => void;
        [key: string]: any;
      };
};
export type RcFile = File & { uid: string; lastModifiedDate?: Date };
export type UploadFileStatus = "error" | "done" | "uploading" | "removed";
export interface UploadFile<T = any> {
  uid: string;
  name: string;
  status?: UploadFileStatus;
  size?: number;
  type?: string;
  originFileObj?: RcFile;
  response?: T;
  url?: string;
  percent?: number;
}
export type UploadChangeParam<T = UploadFile> = {
  file: T;
  fileList: T[];
  event?: { percent: number };
};
export interface UploadProps extends UIProps {
  beforeUpload?: (file: RcFile, files: RcFile[]) => unknown;
  onChange?: (info: UploadChangeParam) => void;
  fileList?: UploadFile[];
}
export type ModalProps = UIProps & {
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  open?: boolean;
  title?: React.ReactNode;
  onOk?: (event?: any) => void | Promise<unknown>;
  onCancel?: (event?: any) => void;
};
export type ModalFuncProps = ModalProps & { content?: React.ReactNode };
export interface ModalHandle extends PromiseLike<boolean> {
  destroy(): void;
  update(config: Partial<ModalFuncProps>): void;
}
export interface ModalStaticFunctions {
  confirm(config: ModalFuncProps): ModalHandle;
  info(config: ModalFuncProps): ModalHandle;
  success(config: ModalFuncProps): ModalHandle;
  error(config: ModalFuncProps): ModalHandle;
  warning(config: ModalFuncProps): ModalHandle;
  warn(config: ModalFuncProps): ModalHandle;
}
export type Hoonapi = ModalStaticFunctions;
export interface MessageInstance {
  success(
    content: React.ReactNode | UIProps,
    duration?: number,
    onClose?: () => void,
  ): () => void;
  error: MessageInstance["success"];
  warning: MessageInstance["success"];
  info: MessageInstance["success"];
  loading: MessageInstance["success"];
  open(config: UIProps): () => void;
  destroy(key?: React.Key): void;
}
export interface NotificationInstance {
  success(config: UIProps): void;
  error(config: UIProps): void;
  info(config: UIProps): void;
  warning(config: UIProps): void;
  open(config: UIProps): void;
  destroy(key?: React.Key): void;
}
