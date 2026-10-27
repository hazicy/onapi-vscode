import { Auth as AuthType } from "@onapi/domain/requests/types/auth";
import { EnvList, ServerItem } from "@onapi/domain/environment/types/index";
import { DomainInfoProps } from "@onapi/domain/project/types/cookie";

type MockFieldType = "string" | "number" | "boolean" | "integer";

export type ProjectInfoReq = {
  project_id: string;
  field: string;
  value: any;
};

export type CodeStatusItem = {
  code_id: string;
  code_number: string;
  code_msg: string;
  no_save?: boolean;
};
export type CodeStatusReq = {
  project_id: string;
  code_list: CodeStatusItem[];
};
export type NoticeItem = {
  hook_id?: string;
  project_id: string;
  name: string;
  hook_type: string;
  enabled?: -1 | 1;
  sort?: number;
  events: string[] | [];
  events_ids?: string[];
  server_url: string;
  server_secret: string;
};
export type MarkItem = {
  mark_id?: string;
  project_id: string;
  name: string;
  color: string;
  is_sys_default?: 1 | -1; // Whether system default (cannot be deleted)
  is_default_mark?: 1 | -1; // Whether set as default (only one per project)
} & {
  no_save?: boolean;
  editing?: boolean;
};

export type CustomAttributeItem = {
  attribute_id: string;
  project_id: string;
  field_name: string;
  field_type: number;
  enable: 1 | -1;
  tooltip: string;
  sort: number;
  extra: {
    key: string;
    label: string;
    value: string;
  }[];
  open_api_field: string;
};

export type DescriptionItem = {
  id: string;
  project_id: string;
  key: string;
  description: string;
  no_save?: number;
};

export type MockInfo = {
  project_id: string;
  mock_engine: number;
  mock_method: number;
  mock_code_method: number;
  mock_rule_switch?: 1 | -1;
};

export type MockItem = {
  mock_custom_rule_id?: string;
  field_type: MockFieldType | "";
  match_type: "wildcard" | "exact";
  match_rule: string;
  match_case: 1 | -1;
  mock_type: number;
  mock_rule_content: string;
  intro: string;
};

export type AutoImportItem = {
  data_source_name: string;
  is_open: 1 | -1;
  import_type: number; // 1=Minutes 2=Hours
  import_interval: number; // -1=manual, 3=3hrs, 12=12hrs, 24=24hrs, 0=custom
  import_time: number; // Custom time
  data_source_format: 0; // Data source type: 0:openApi......
  data_source_url: string; // Data source URL
  folder_id: string;
  is_base_path: 1 | -1; // Whether to add basePath to API path: 1=yes, -1=no
  is_host_path: 1 | -1; // Whether to add host to API path: 1=yes, -1=no
  sort: 0;
  api_cover_modal: string;
  model_cover_modal: string;
  env_cover_modal: string;
};

export type AutoSyncImportItem = AutoImportItem & {
  project_id: string;
  auto_import_id: string;
};

export type ConnectToDatabaseDBConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  auth_source: string;
};
export type ConnectToDatabaseSSHConfig = {
  enable: 1 | -1;
  host: string;
  port: number;
  auth_type: 1 | 2 | 3;
  username: string;
  password: string;
  private_key: string;
  passphrase: string;
};
export type ConnectToDatabaseConfig = {
  db_config: ConnectToDatabaseDBConfig;
  ssh: ConnectToDatabaseSSHConfig;
  use_default?: 1 | -1;
};
export type ConnectToDatabaseItem = {
  project_id?: string;
  db_id?: string;
  name: string;
  type: string;
  intro: string;
  sort: number;
  config: {
    default: ConnectToDatabaseConfig;
    [k: string]: ConnectToDatabaseConfig;
  };
};

export type GlobalParamsHeaderItem = {
  schema?: any;
  param_id: string;
  description: string;
  field_type: string;
  is_checked: number;
  key: string;
  value: string;
  not_null: number;
  type?: string;
};

export type GlobalParamsTypeItem = GlobalParamsHeaderItem & {
  type: string;
};

export type GlobalParamsCookieItem = GlobalParamsHeaderItem & {
  sort: number;
};

export type GlobalParamsAuthItem = {
  type: string;
  kv: {
    key: string;
    value: string;
  };
  bearer: {
    key: string;
  };
  basic: {
    username: string;
    password: string;
  };
  digest: {
    username: string;
    password: string;
    realm: string;
    nonce: string;
    algorithm: string;
    qop: string;
    nc: string;
    cnonce: string;
    opaque: string;
  };
  hawk: {
    authId: string;
    authKey: string;
    algorithm: string;
    user: string;
    nonce: string;
    extraData: string;
    app: string;
    delegation: string;
    timestamp: string;
    includePayloadHash: number;
  };
  awsv4: {
    accessKey: string;
    secretKey: string;
    region: string;
    service: string;
    sessionToken: string;
    addAuthDataToQuery: number;
  };
  ntlm: {
    username: string;
    password: string;
    domain: string;
    workstation: string;
    disableRetryRequest: number;
  };
  edgegrid: {
    accessToken: string;
    clientToken: string;
    clientSecret: string;
    nonce: string;
    timestamp: string;
    baseURi: string;
    headersToSign: string;
  };
  oauth1: {
    consumerKey: string;
    consumerSecret: string;
    signatureMethod: string;
    addEmptyParamsToSign: boolean;
    includeBodyHash: boolean;
    addParamsToHeader: number;
    realm: string;
    version: string;
    nonce: string;
    timestamp: string;
    verifier: string;
    callback: string;
    tokenSecret: string;
    token: string;
  };
};

export type GlobalParamsScriptItem = {
  pre_script_switch: number;
  pre_script: string;
  post_script_switch: number;
  post_script: string;
};

export type GlobalParams = {
  header: GlobalParamsHeaderItem[];
  query: GlobalParamsTypeItem[];
  body: GlobalParamsTypeItem[];
  cookie: GlobalParamsCookieItem[];
  auth: AuthType;
  script: GlobalParamsScriptItem;
};

/** Shared parameters used only by socket transports. HTTP uses Collection inheritance. */
export type SocketGlobalParams = {
  header: { parameter: GlobalParamsHeaderItem[] };
  query: { parameter: GlobalParamsTypeItem[] };
  cookie: { parameter: GlobalParamsCookieItem[] };
};

export type ProjectConfigType = {
  http?: import("@onapi/domain").HttpProjectConfig;
  globalVars?: any;
  globalParams?: Partial<SocketGlobalParams>;
  envList: EnvList;
  envOpen?: boolean;
  envSettingKeys?: string;
  establish?: boolean;
  envDetailKeys?: string;
  tags?: string[];
  cookie?: DomainInfoProps;
  serverList: ServerItem[];
};

export type FunctionItem = {
  func_id?: string;
  project_id: string;
  func_name: string;
  func_desc?: string;
  func_type?: string;
  func_body?: string;
  sort?: number;
  created_id: string;
  updated_id: string;
  created_at?: string;
  updated_at?: string;
};
