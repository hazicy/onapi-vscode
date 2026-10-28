export type TableColumnSwitchConfig = {
  parameter_description: 1 | -1;
  parameter_type: 1 | -1;
  content_type: 1 | -1;
};
import { DefaultRequestSystemHeaders } from "@onapi/domain/requests/types/request";
import { IMPORT_TYPE_ENUM } from "@onapi/domain/settings/constants/settings";

export type FILE_OBJ = {
  // File name
  file_name: string;
  // File path
  file_url: string;
  // File content
  file_base64: string;
};
// Client certificate info
export interface ClientCertificates {
  // Port
  port: number;
  // Domain
  host: string;
  // Private key password
  password: string;
  // Certificate chain (PEM or CRT format)
  crt: FILE_OBJ;

  // Private key (PEM or KEY format)
  key: FILE_OBJ;

  // PFX certificate chain (PFX format)
  pfx: FILE_OBJ;
}

export interface SysConfig {
  global_cookie_open: 1 | -1; //Global cookie on/off
  // Background: dark, white, gray
  bg_color: "white" | "dark" | "gray" | "orange" | "lightgray" | "darkgrey";

  // Theme color【orange,blue,green,pink,purple,lakeblue,pinkpurple】
  theme_color:
    | "orange"
    | "blue"
    | "pink"
    | "purple"
    | "green"
    | "pinkpurple"
    | "lakeblue";

  // Font scale
  font_scale: number;

  // Default font size
  font_size?: number;

  // Font
  font_family?: string;

  //  Language: en, zh-cn
  language: "en" | "zh-cn";

  // Default request timeout
  send_timeout: number;

  // Auto redirect: 1=on, -1=off
  auto_redirect: 1 | -1;

  // Max auto redirect count
  max_redirect_time: number;

  // Auto-detect request params mock: 1=on, -1=off
  auto_gen_mock_url: 1 | -1;

  // Auto JSON for request params: 1=on, -1=off
  request_param_auto_json: 1 | -1;

  //  Proxy mode: 1=Use, 2=Don't use, 3=Custom
  proxy: 1 | 2 | 3;

  //  Prioritize HTTP PROXY, HTTPS PROXY, NO PROXY env vars: 1=on, -1=off
  request_proxy_sys_open: 1 | -1;

  // PROXY BYPASS, comma-separated IPs
  request_proxy_bypass: string;

  // Auth enabled: 1=on, -1=off
  request_proxy_auth_open: 1 | -1;
  request_proxy_auth: {
    //  Auth username：request_proxy_auth_username
    request_proxy_auth_username: string;
    // Auth password：request_proxy_auth_password
    request_proxy_auth_password: string;
  };
  //  Proxy type:request_proxy_type :[http,https]
  request_proxy_type: ("http" | "https")[];

  //  Proxy server address:request_proxy_url
  request_proxy_url: string;

  //  Proxy server address:request_proxy_port
  request_proxy_port: number;

  //  CA certificate enabled
  ca_certificate: {
    open: 1 | -1;
  } & FILE_OBJ;

  //  Client certificate
  client_certificate: { [k: string]: ClientCertificates };

  //Save response example after send: 1=Don't save, 2=Save to success, 3=Save to failure
  send_after_save_example: 1 | 2 | 3;

  //  Show assertions and validation: 1=on, -1=off
  assertions_and_validation_results: 1 | -1;

  // Switch to Response tab after send: 1=on, -1=off
  send_after_response_to_tab: 1 | -1;

  // Auto-switch to Beautify panel after send: 1=on, -1=off
  send_after_auto_beautify: 1 | -1;

  //  Default request method for new API
  request_method: string;

  // Default request mode for new API
  request_mode: string;

  //Auto-add equals to query for new API: 1=on, -1=off
  request_query_add_equal: 1 | -1;

  //  Auto-navigate to new tab after clone: 1=on, -1=off
  auto_open_clone_new_tab: 1 | -1;

  // Max console entries to keep
  // max_console_save: number;
  //  Directory click: 1=Open tab, 2=Expand directory
  folder_click_set: 1 | 2;

  // Default tab when opening API
  open_new_tab: "debug";

  // API split direction
  tab_direction: -1 | 1;

  // Default code generation mode
  generate_code_mode?: [string, string];

  // When client close button clicked
  client_close_config: -1 | 1;
  /**System request header */
  systemRequestHeader?: DefaultRequestSystemHeaders[];

  systemRequestHeaderWebSocket?: DefaultRequestSystemHeaders[];

  // Request header column config
  request_header_column_switch: TableColumnSwitchConfig;

  // Request body column config
  request_body_column_switch: TableColumnSwitchConfig;

  // Request query column config
  request_query_column_switch: TableColumnSwitchConfig;

  // Request cookie column config
  request_cookie_column_switch: TableColumnSwitchConfig;

  // Parameter description column config
  raw_parameter_column_switch: TableColumnSwitchConfig;

  // Parameter list bubble tooltip
  raw_parameter_pilot_bubble_switch?: boolean;

  // Import data initial selection type
  import_data_init_type?: IMPORT_TYPE_ENUM;
}
