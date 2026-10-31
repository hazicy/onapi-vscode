// Host-only parameter preparation for socket transports.
import { AnyObject, CustomNumberBooleanType } from "@onapi/domain/types/common";
import { ProjectConfigType } from "@onapi/domain/project/types/index";
import { SysConfig } from "@onapi/domain/settings/types/settings";

export type PrepareSocketOptions = (params: {
  envId?: string;
  targetId?: string;
  collection?: SocketHostOptions["collection"];
  projectConfig?: ProjectConfigType;
  systemConfig?: SysConfig;
  curServerId?: string;
  type?: string;
}) => Promise<SocketHostOptions>;

export interface SocketHostOptions {
  env?: Env;
  globals?: Globals;
  project?: Project;
  cookies?: Cookies;
  collection?: import("@onapi/domain/request-utils").SocketCollectionItem[];
  system_configs?: SystemConfigs;
  [key: string]: any;
}

export interface Cookies {
  switch: CustomNumberBooleanType;
  data: any[];
}

export interface Env {
  env_id: string;
  env_name: string;
  env_pre_url: string;
  env_pre_urls: { [key: string]: EnvPreURL };
  environment: AnyObject;
}

export interface EnvPreURL {
  server_id: string;
  name: string;
  uri: string;
}

export type Globals = AnyObject;

export interface Project {
  request: Partial<Omit<any, "script">>;
}

export interface SystemConfigs {
  send_timeout: number;
  auto_redirect: CustomNumberBooleanType;
  max_redirect_time: number;
  auto_gen_mock_url: CustomNumberBooleanType;
  request_param_auto_json: CustomNumberBooleanType;
  proxy: Proxy;
  ca_cert: CaCert;
  client_cert: ClientCert;
}

export interface CaCert {
  open: CustomNumberBooleanType;
  path: string;
  base64: string;
}

export interface ClientCert {
  [x: string]: any & { HOST: string };
}

export interface CRT {
  file_url: string;
  file_base64: string;
  file_name: string;
}

export interface Proxy {
  type: number;
  envfirst: CustomNumberBooleanType;
  bypass: string[];
  protocols: string[];
  auth: Auth;
}

export interface Auth {
  authenticate: CustomNumberBooleanType;
  host: string | (string | number)[];
  username: string;
  password: string;
}
