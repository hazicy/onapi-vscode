/**
 * NOTE mod in react-hotkeys-hook ctrl on Windows/Linux and cmd on macOS
 */

// System hotkey scope enum
export enum SYSTEM_HOT_KEYS_SCOPES_ENUM {
  APIS = "apis",
  TESTING = "testing",
  SHARE = "share",
  SCHEMAS = "schemas",
  SETTINGS = "settings",
  NOTES = "notes",
  HISTORY = "history",
  GLOBAL = "global",
}

export enum COMMON_HOT_KEYS_ENUM {
  SAVE = "save",
  CLOSE = "close",
  SAVE_ALL = "save_all",
}

// Common
export const DEFAULT_COMMON_HOT_KEYS_MAP = {
  [COMMON_HOT_KEYS_ENUM.SAVE]: ["mod+s"],
  [COMMON_HOT_KEYS_ENUM.CLOSE]: ["mod+w"],
  [COMMON_HOT_KEYS_ENUM.SAVE_ALL]: ["mod+shift+s"],
};

export enum APIS_HOT_KEYS_ENUM {
  IMPORT_CURL = "import_curl",
  CREATE_APIS = "create_apis",
  SEND = "send",
  LOCK = "lock",
  GEN_CODE = "gen_code",
  CLONE = "clone",
  SEARCH = "search",
  SAVE = "save",
  CLOSE = "close",
}

// APIs
export const DEFAULT_APIS_HOT_KEYS_MAP = {
  [APIS_HOT_KEYS_ENUM.SAVE]: ["mod+s"],
  [APIS_HOT_KEYS_ENUM.CLOSE]: ["mod+w"],
  [APIS_HOT_KEYS_ENUM.SEND]: ["mod+enter", "alt+s"],
};

export enum FOLDER_HOT_KEYS_ENUM {
  COPY = "copy",
  PASTE = "paste",
}

// Folder
export const DEFAULT_FOLDER_HOT_KEYS_MAP = {
  [FOLDER_HOT_KEYS_ENUM.COPY]: ["mod+c"],
  [FOLDER_HOT_KEYS_ENUM.PASTE]: ["mod+v"],
};

export enum WINDOW_HOT_KEYS_ENUM {
  COMPACT_VIEW = "compact_view",
  ZOOM_IN = "zoom_in",
  ZOOM_OUT = "zoom_out",
}

// Window and view
export const DEFAULT_WINDOW_HOT_KEYS_MAP = {
  [WINDOW_HOT_KEYS_ENUM.COMPACT_VIEW]: ["mod+j"],
  [WINDOW_HOT_KEYS_ENUM.ZOOM_IN]: ["mod+="],
  [WINDOW_HOT_KEYS_ENUM.ZOOM_OUT]: ["mod+-"],
};

export enum OTHER_HOT_KEYS_ENUM {
  CREATE = "create",
  SYSTEM_SETTINGS = "system_settings",
  COOKIE_MANGE = "cookie_mange",
  SHARE_PROJECT = "share_project",
  GLOBAL_PARAMS = "global_params",
  PARAMS_LIB = "params_lib",
  ENV_VARS = "env_vars",
  SYNC_TEAMWORK_DATA = "sync_teamwork_data",
  CLIENT_DEV_TOOL = "client_dev_tool",
}

// Others
export const DEFAULT_OTHER_HOT_KEYS_MAP = {
  [OTHER_HOT_KEYS_ENUM.CREATE]: ["mod+n"],
  [OTHER_HOT_KEYS_ENUM.SYSTEM_SETTINGS]: ["mod+comma"],
  [OTHER_HOT_KEYS_ENUM.COOKIE_MANGE]: ["alt+shift+c"],
  [OTHER_HOT_KEYS_ENUM.SHARE_PROJECT]: ["alt+shift+f"],
  [OTHER_HOT_KEYS_ENUM.GLOBAL_PARAMS]: ["alt+shift+q"],
  [OTHER_HOT_KEYS_ENUM.PARAMS_LIB]: ["alt+shift+m"],
  [OTHER_HOT_KEYS_ENUM.ENV_VARS]: ["alt+shift+h"],
  [OTHER_HOT_KEYS_ENUM.SYNC_TEAMWORK_DATA]: ["mod+r"],
  [OTHER_HOT_KEYS_ENUM.CLIENT_DEV_TOOL]: ["a+p+i+o+s+t"],
};

export const HOT_KEYS_COMBINATION_KEY = "+";

export const DEFAULT_HOT_KEYS_OPTIONS = {
  splitKey: HOT_KEYS_COMBINATION_KEY,
  preventDefault: true,
  enableOnFormTags: true,
  enableOnContentEditable: true,
};
