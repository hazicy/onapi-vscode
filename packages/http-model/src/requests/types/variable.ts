export type InnerFuncListItem = {
  function: string;
  description: string;
  params?: {
    type: string;
    default: string | number | undefined;
    options?: { value: string; label: string }[];
    key?: string;
    placeholder?: string;
  }[];
};

export type FuncListRenderItem = {
  func_name: string;
  func_desc: string | undefined;
  paras?: Record<string, any>;
};

export type GetParseValueParams = {
  expression: string;
  options: {
    custom_script: Record<string, string>;
    globals: Record<string, any>;
    environment: Record<string, any>;
  };
};

export enum InsertAction {
  replace,
  insert,
  confirm,
}
