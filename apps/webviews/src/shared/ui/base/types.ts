export interface DataNode {
  id?: React.Key;
  name?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode | ((node: DataNode) => React.ReactNode);
  key: React.Key;
  title?: React.ReactNode;
  children?: DataNode[];
  isLeaf?: boolean;
  disabled?: boolean;
  disableCheckbox?: boolean;
  selectable?: boolean;
  checkable?: boolean;
}
export type TreeEventNode<T = DataNode> = T & {
  key: React.Key;
  pos: string;
  expanded: boolean;
  selected: boolean;
  checked: boolean;
};
export interface TreeProps<T = DataNode> extends Omit<
  DOMProps,
  "onDrop" | "onDragOver" | "draggable"
> {
  switcherIcon?:
    | React.ReactNode
    | ((node: TreeEventNode<T>) => React.ReactNode);
  icon?: React.ReactNode | ((node: TreeEventNode<T>) => React.ReactNode);
  showIcon?: boolean;
  height?: number;
  expandAction?: false | "click" | "doubleClick";
  autoExpandParent?: boolean;
  onRightClick?: (info: {
    event: React.MouseEvent;
    node: TreeEventNode<T>;
  }) => void;
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
}
export interface TreeHandle {
  scrollTo: (options: { key: React.Key }) => void;
}
export type { ThemeConfig } from "./Theme";
export type { DrawerProps } from "../Drawer";
export type GetProps<T> = T extends React.ComponentType<infer P> ? P : never;
/** Shared presentation and accessibility props; behavior belongs to each control. */
export interface UIProps extends React.AriaAttributes {
  children?: React.ReactNode;
  className?: string;
  rootClassName?: string;
  style?: React.CSSProperties;
  id?: string;
  disabled?: boolean;
}
export type DOMProps<T extends HTMLElement = HTMLElement> = UIProps &
  Omit<
    React.HTMLAttributes<T>,
    | keyof UIProps
    | "onChange"
    | "onSelect"
    | "title"
    | "content"
    | "defaultValue"
    | "color"
  >;
type Size = "small" | "middle" | "large";
type PopupRenderer = (content: React.ReactNode) => React.ReactNode;
interface PopupProps extends DOMProps {
  title?: React.ReactNode | (() => React.ReactNode);
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: string;
  trigger?: string | string[];
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  overlayInnerStyle?: React.CSSProperties;
  destroyTooltipOnHide?: boolean;
}
export interface Option extends UIProps {
  key?: React.Key;
  title?: string;
  icon?: React.ReactNode;
  value?: string | number | boolean;
  label?: React.ReactNode;
  options?: Option[];
}
export interface ButtonProps extends DOMProps {
  title?: string;
  size?: Size;
  icon?: React.ReactNode;
  danger?: boolean;
  ghost?: boolean;
  block?: boolean;
  shape?: "default" | "circle" | "round";
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
export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "prefix"
> {
  rootClassName?: string;
  size?: Size;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  allowClear?: boolean;
  bordered?: boolean;
  status?: "error" | "warning";
  variant?: "outlined" | "borderless" | "filled";
  onSearch?: (
    value: string,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => void;
  suffixClassName?: string;
  inputClassName?: string;
  affixClassName?: string;
  outlinedClassName?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onPressEnter?: React.KeyboardEventHandler<HTMLInputElement>;
}
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  rootClassName?: string;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  inputClassName?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  onPressEnter?: React.KeyboardEventHandler<HTMLTextAreaElement>;
}
export interface SelectProps<
  V = any,
  O extends Option = Option,
> extends DOMProps {
  size?: Size;
  onDeselect?: (value: V, option: O) => void;
  showSearch?: boolean;
  allowClear?: boolean;
  labelInValue?: boolean;
  fieldNames?: { label?: string; value?: string; options?: string };
  optionFilterProp?: string;
  dropdownRender?: PopupRenderer;
  popupRender?: PopupRenderer;
  placeholder?: React.ReactNode;
  placement?: string;
  dropdownStyle?: React.CSSProperties;
  open?: boolean;
  defaultOpen?: boolean;
  onDropdownVisibleChange?: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void;
  notFoundContent?: React.ReactNode;
  bordered?: boolean;
  variant?: string;
  suffixIcon?: React.ReactNode;
  removeIcon?: React.ReactNode;
  maxTagCount?: number | "responsive";
  tagRender?: (props: {
    label: React.ReactNode;
    value: V;
    closable: boolean;
    onClose: () => void;
  }) => React.ReactNode;
  tokenSeparators?: string[];
  autoClearSearchValue?: boolean;
  loading?: boolean;
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
  onSelect?: (value: V, option: O) => void;
  labelRender?: (props: {
    label: React.ReactNode;
    value: V;
  }) => React.ReactNode;
  optionRender?: (
    option: O & { data: O },
    info: { index: number },
  ) => React.ReactNode;
  filterOption?: boolean | ((input: string, option: O) => boolean);
  onSearch?: (text: string) => void;
  mode?: "multiple" | "tags";
}
export interface InputNumberProps<V = number> extends DOMProps<HTMLDivElement> {
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  readOnly?: boolean;
  controls?: boolean;
  precision?: number;
  stringMode?: boolean;
  formatter?: (value: V | undefined) => string;
  parser?: (value: string | undefined) => V;
  inputClassName?: string;
  value?: V | null;
  defaultValue?: V;
  onChange?: (value: V | null) => void;
}
export interface CheckboxProps extends DOMProps {
  name?: string;
  indeterminate?: boolean;
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
export type RadioGroupProps = DOMProps & {
  name?: string;
  optionType?: "default" | "button";
  buttonStyle?: "outline" | "solid";
  options?: (Option | string | number)[];
  value?: any;
  defaultValue?: any;
  onChange?: (e: RadioChangeEvent) => void;
};
export type SwitchProps = DOMProps & {
  thumbClassName?: string;
  checkedChildren?: React.ReactNode;
  unCheckedChildren?: React.ReactNode;
  loading?: boolean;
  size?: Size;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, event: Event) => void;
};
export type MenuProps = UIProps & {
  overlayClassName?: string;
  selectedKeys?: string[];
  defaultOpenKeys?: string[];
  mode?: "vertical" | "horizontal" | "inline";
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
  icon?: React.ReactNode;
  type?: string;
  onClick?: MenuProps["onClick"];
  children?: MenuItemProps[] | null;
}
export type ItemType = MenuItemProps;
export type TooltipProps = PopupProps & {
  color?: string;
  overlayClassName?: string;
  title?: React.ReactNode | (() => React.ReactNode);
};
export type PopoverProps = TooltipProps & {
  content?: React.ReactNode | (() => React.ReactNode);
};
export type DropdownProps = DOMProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, info: { source: "menu" | "trigger" }) => void;
  trigger?: string[];
  placement?: string;
  dropdownRender?: PopupRenderer;
  popupRender?: PopupRenderer;
  overlay?: React.ReactNode;
  overlayStyle?: React.CSSProperties;
  destroyPopupOnHide?: boolean;
  menu?: MenuProps;
  overlayClassName?: string;
  itemClassName?: string;
  selectedItemClassName?: string;
};
export type CollapseProps = DOMProps & {
  activeKey?: React.Key | React.Key[];
  defaultActiveKey?: React.Key | React.Key[];
  accordion?: boolean;
  onChange?: (keys: React.Key | React.Key[]) => void;
  expandIcon?: (props: { isActive?: boolean }) => React.ReactNode;
  expandIconPosition?: "start" | "end";
  ghost?: boolean;
  bordered?: boolean;
  destroyInactivePanel?: boolean;
  size?: Size;
  itemClassName?: string;
  headerClassName?: string;
  triggerClassName?: string;
  panelClassName?: string;
  contentClassName?: string;
  items?: (UIProps & {
    key?: React.Key;
    label?: React.ReactNode;
    extra?: React.ReactNode;
    collapsible?: "header" | "icon" | "disabled";
    destroyOnHidden?: boolean;
  })[];
};
export type TabsProps = DOMProps & {
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  onEdit?: (key: string, action: "add" | "remove") => void;
  tabBarExtraContent?:
    | React.ReactNode
    | { left?: React.ReactNode; right?: React.ReactNode };
  type?: "line" | "card" | "editable-card";
  destroyInactiveTabPane?: boolean;
  tabPosition?: "top" | "bottom" | "left" | "right";
  size?: Size;
  animated?: boolean;
  navClassName?: string;
  navWrapClassName?: string;
  tabListClassName?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  tabButtonClassName?: string;
  contentClassName?: string;
  panelsClassName?: string;
  panelClassName?: string;
  items?: (UIProps & {
    key: string;
    label: React.ReactNode;
    tabExtra?: React.ReactNode;
    closable?: boolean;
    destroyOnHidden?: boolean;
  })[];
};
export type TabPaneProps = UIProps & {
  tab?: React.ReactNode;
  tabKey?: string;
  tabExtra?: React.ReactNode;
};
export type SegmentedProps<V = string | number> = DOMProps & {
  defaultValue?: V;
  size?: Size;
  block?: boolean;
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
export type SkeletonProps = DOMProps & {
  loading?: boolean;
  active?: boolean;
  paragraph?: { rows?: number };
  size?: Size;
};
export type TagProps = DOMProps<HTMLSpanElement> & {
  color?: string;
  closable?: boolean;
  onClose?: React.MouseEventHandler<HTMLButtonElement>;
  icon?: React.ReactNode;
  bordered?: boolean;
};
export type AlertProps = UIProps & {
  message?: React.ReactNode;
  messageClassName?: string;
  description?: React.ReactNode;
  type?: "success" | "info" | "warning" | "error";
  showIcon?: boolean;
  icon?: React.ReactNode;
  closable?: boolean;
  onClose?: React.MouseEventHandler<HTMLButtonElement>;
  action?: React.ReactNode;
};
export type EmptyProps = UIProps & {
  description?: React.ReactNode;
  image?: React.ReactNode;
  imageClassName?: string;
  descriptionClassName?: string;
  footerClassName?: string;
};
export interface TreeSelectProps<V = any> extends UIProps {
  id?: string;
  defaultValue?: V;
  onSelect?: (value: V, node: DataNode) => void;
  showSearch?: boolean;
  searchValue?: string;
  onSearch?: (value: string) => void;
  treeDefaultExpandAll?: boolean;
  treeDefaultExpandedKeys?: React.Key[];
  treeExpandedKeys?: React.Key[];
  onTreeExpand?: (keys: React.Key[]) => void;
  treeExpandAction?: false | "click" | "doubleClick";
  placeholder?: string;
  popupClassName?: string;
  dropdownClassName?: string;
  dropdownStyle?: React.CSSProperties;
  dropdownRender?: PopupRenderer;
  popupRender?: PopupRenderer;
  open?: boolean;
  defaultOpen?: boolean;
  onDropdownVisibleChange?: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void;
  allowClear?: boolean;
  treeNodeFilterProp?: "title" | "key" | "name" | "id";
  treeNodeLabelProp?: string;
  notFoundContent?: React.ReactNode;
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
  width?: number | string;
  align?: "left" | "right" | "center";
  fixed?: "left" | "right" | boolean;
  ellipsis?: boolean;
  sorter?: boolean | ((a: T, b: T) => number);
  onCell?: (
    record: T,
    index?: number,
  ) => React.TdHTMLAttributes<HTMLTableCellElement>;
  onHeaderCell?: (
    column: TableColumnType<T>,
  ) => React.ThHTMLAttributes<HTMLTableCellElement> & {
    width?: number | string;
    key?: React.Key;
    onResize?: (
      event: React.SyntheticEvent<Element>,
      data: import("react-resizable").ResizeCallbackData,
    ) => void;
  };
  key?: React.Key;
  title?:
    | React.ReactNode
    | ((props: {
        sortColumns: { id: string; desc: boolean }[];
      }) => React.ReactNode);
  dataIndex?: string | number | (string | number)[];
  render?: (value: any, record: T, index: number) => React.ReactNode;
  children?: TableColumnType<T>[];
}
export type TableColumnsType<T = any> = TableColumnType<T>[];
export type TableProps<T = any> = DOMProps<HTMLDivElement> & {
  borderedClassName?: string;
  cellClassName?: string;
  loading?: boolean;
  size?: Size;
  locale?: { emptyText?: React.ReactNode };
  tableLayout?: React.CSSProperties["tableLayout"];
  bordered?: boolean;
  scroll?: { x?: number | string; y?: number | string };
  showHeader?: boolean;
  onRow?: (
    record: T,
    index: number,
  ) => React.HTMLAttributes<HTMLTableRowElement>;
  rowClassName?: string | ((record: T, index: number) => string);
  onChange?: (
    pagination: false | { current?: number; pageSize?: number },
    filters: Record<string, unknown>,
    sorter:
      | {
          field?: string | number | (string | number)[];
          order?: "ascend" | "descend";
          columnKey?: React.Key;
        }
      | {},
    extra: { action: string; currentDataSource: T[] },
  ) => void;
  dataSource?: T[];
  columns?: TableColumnType<T>[];
  rowKey?: string | ((record: T, index: number) => React.Key);
  components?: {
    body?: {
      wrapper?: React.ElementType;
      row?: React.ElementType;
      cell?: React.ElementType;
    };
    header?: {
      wrapper?: React.ElementType;
      row?: React.ElementType;
      cell?: React.ElementType;
    };
  };
  rowSelection?: {
    type?: "checkbox" | "radio";
    columnWidth?: number | string;
    hideSelectAll?: boolean;
    columnTitle?:
      | React.ReactNode
      | ((node: React.ReactNode) => React.ReactNode);
    onSelectAll?: (selected: boolean, rows: T[], changedRows: T[]) => void;
    selectedRowKeys?: React.Key[];
    defaultSelectedRowKeys?: React.Key[];
    onChange?(keys: React.Key[], rows: T[], info: { type: string }): void;
    renderCell?: (
      checked: boolean,
      record: T,
      index: number,
      node: React.ReactNode,
    ) => React.ReactNode;
    getCheckboxProps?: (record: T) => CheckboxProps;
    onSelect?: (record: T, selected: boolean, rows: T[]) => void;
  };
  pagination?:
    | false
    | {
        onShowSizeChange?: (page: number, pageSize: number) => void;
        pageSizeOptions?: (string | number)[];
        defaultCurrent?: number;
        defaultPageSize?: number;
        showSizeChanger?: boolean;
        hideOnSinglePage?: boolean;
        current?: number;
        pageSize?: number;
        total?: number;
        showTotal?: (total: number, range: [number, number]) => React.ReactNode;
        onChange?: (page: number, pageSize: number) => void;
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
  itemClassName?: string;
  defaultFileList?: UploadFile[];
  onRemove?: (file: UploadFile) => boolean | void | Promise<boolean | void>;
  maxCount?: number;
  showUploadList?: boolean;
  iconRender?: (file: UploadFile) => React.ReactNode;
  accept?: string;
  multiple?: boolean;
  name?: string;
  onDrop?: React.DragEventHandler<HTMLDivElement>;
  customRequest?: (options: {
    file: Blob;
    filename: string;
    onSuccess: (response: unknown) => void;
    onError: (error: Error, response?: unknown) => void;
    onProgress: (event: { percent?: number }) => void;
  }) => unknown;
  beforeUpload?: (file: RcFile, files: RcFile[]) => unknown;
  onChange?: (info: UploadChangeParam) => void;
  fileList?: UploadFile[];
}
export type ModalProps = UIProps & {
  footer?:
    | React.ReactNode
    | ((
        buttons: React.ReactNode,
        controls: {
          OkBtn: React.ComponentType;
          CancelBtn: React.ComponentType;
        },
      ) => React.ReactNode);
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  confirmLoading?: boolean;
  okCancel?: boolean;
  closable?: boolean;
  closeIcon?: React.ReactNode;
  mask?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  centered?: boolean;
  width?: number | string;
  destroyOnClose?: boolean;
  destroyOnHidden?: boolean;
  forceRender?: boolean;
  afterClose?: () => void;
  afterOpenChange?: (open: boolean) => void;
  focusTriggerAfterClose?: boolean;
  styles?: Partial<
    Record<
      "mask" | "content" | "header" | "body" | "footer",
      React.CSSProperties
    >
  >;
  zIndex?: number;
  okButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  wrapClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  open?: boolean;
  title?: React.ReactNode;
  onOk?: (event?: React.MouseEvent<HTMLElement>) => void | Promise<unknown>;
  onCancel?: (event?: Event | React.MouseEvent<HTMLElement>) => void;
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
    content: React.ReactNode | ToastConfig,
    duration?: number,
    onClose?: () => void,
  ): () => void;
  error: MessageInstance["success"];
  warning: MessageInstance["success"];
  info: MessageInstance["success"];
  loading: MessageInstance["success"];
  open(config: ToastConfig): () => void;
  destroy(key?: React.Key): void;
}
export interface NotificationInstance {
  success(config: ToastConfig): void;
  error(config: ToastConfig): void;
  info(config: ToastConfig): void;
  warning(config: ToastConfig): void;
  open(config: ToastConfig): void;
  destroy(key?: React.Key): void;
}

export interface ToastConfig {
  key?: React.Key;
  content?: React.ReactNode;
  message?: React.ReactNode;
  description?: React.ReactNode;
  duration?: number;
  onClose?: () => void;
  type?: "success" | "error" | "warning" | "info" | "loading";
}
export type FlexProps = DOMProps<HTMLDivElement> & {
  vertical?: boolean;
  align?: React.CSSProperties["alignItems"];
  justify?: React.CSSProperties["justifyContent"];
  gap?: number | string;
  wrap?: boolean | React.CSSProperties["flexWrap"];
  flex?: React.CSSProperties["flex"];
  component?: React.ElementType;
};
export type SpaceProps = FlexProps & {
  size?: number | Size | [number, number];
  direction?: "horizontal" | "vertical";
  split?: React.ReactNode;
};
export type TypographyProps = DOMProps & {
  title?: string;
  ellipsis?: boolean | { tooltip?: boolean };
  copyable?: boolean;
  editable?: boolean;
  type?: "secondary" | "success" | "warning" | "danger";
  strong?: boolean;
  code?: boolean;
  underline?: boolean;
  delete?: boolean;
};
export type BadgeProps = UIProps & {
  countClassName?: string;
  count?: React.ReactNode;
  status?: string;
  color?: string;
  text?: React.ReactNode;
  showZero?: boolean;
  overflowCount?: number;
};
export type ColProps = DOMProps<HTMLDivElement> & {
  span?: number;
  offset?: number;
};
export type RowProps = FlexProps & { gutter?: number | [number, number] };
export type DividerProps = DOMProps & {
  type?: "horizontal" | "vertical";
  dashed?: boolean;
  orientation?: "left" | "right" | "center";
};
export type SpinProps = UIProps & {
  contentClassName?: string;
  spinning?: boolean;
  tip?: React.ReactNode;
  size?: Size;
};
export type ProgressProps = UIProps & {
  percent?: number;
  status?: string;
  type?: string;
  format?: (percent: number) => React.ReactNode;
};
export type DatePickerProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  value?: import("dayjs").Dayjs | string | null;
  onChange?: (value: import("dayjs").Dayjs | null, text: string) => void;
  format?: string;
  showTime?: boolean;
};
export type CheckboxGroupProps = DOMProps<HTMLDivElement> & {
  options?: (Option | string | number)[];
  value?: (string | number | boolean)[];
  defaultValue?: (string | number | boolean)[];
  onChange?: (value: (string | number | boolean)[]) => void;
};
export type AutoCompleteProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "onSelect" | "size"
> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onSelect?: (value: string, option: Option | undefined) => void;
  options?: Option[];
  allowClear?: boolean;
  showArrow?: boolean;
  arrowClassName?: string;
  triggerClassName?: string;
  filterOption?: boolean | ((value: string, option: Option) => boolean);
};
export type PopconfirmProps = PopupProps & {
  description?: React.ReactNode;
  onConfirm?: (event: React.MouseEvent<HTMLElement>) => unknown;
  onCancel?: React.MouseEventHandler<HTMLElement>;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  showCancel?: boolean;
};
