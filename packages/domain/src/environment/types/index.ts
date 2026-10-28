export type VarListItem = {
  value: string;
  current_value: string;
  description: string;
};

export type VarList = {
  global_var_list: { [key: string]: VarListItem };
  time: string;
};

export type ServerItem = {
  mode?: string;
  server_id: string;
  name: string;
  uri: string;
  sort: number;
  is_default?: number;
};

export type EnvListItem = {
  env_id: string;
  name: string;
  is_private: number;
  server_list: ServerItem[];
  env_var_list: { [key: string]: VarListItem };
  sort?: number;
  project_id?: string;
  isLocal?: boolean;
};

export type EnvList = EnvListItem[];
