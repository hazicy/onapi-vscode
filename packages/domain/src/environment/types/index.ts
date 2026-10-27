export type GetVarList = {
  project_id: string | undefined;
};

export type VarListItem = {
  value: string;
  current_value: string;
  description: string;
};

export type VarList = {
  global_var_list: { [key: string]: VarListItem };
  time: string;
};

export type SaveVarList = {
  global_var_list: { [key: string]: VarListItem };
  project_id: string | undefined;
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

export type delServerParams = {
  project_id: string | undefined;
  server_id: string;
};

export type upServerParams = {
  project_id: string | undefined;
  server_id: string;
  name: string;
};

export type addServerParams = {
  project_id: string | undefined;
  name: string;
};

export type addServerResponse = {
  project_id: string;
  name: string;
  server_id: string;
  sort: number;
};

export type DelEnvParams = {
  project_id: string | undefined;
  env_id: string;
};

export type AddEnvResponse = {
  env_id: string;
  sort: number;
};

export type MultiMoveParams = {
  project_id: string;
  env_ids?: string[];
  server_ids?: string[];
  after_id: string;
  before_id: string;
};

export type EnvDetailsRequest = {
  project_id: string;
  env_id: string;
};

export type ServerDetailsRequest = {
  project_id: string;
  server_id: string;
};
