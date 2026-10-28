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

export const HOT_KEYS_COMBINATION_KEY = "+";

export const DEFAULT_HOT_KEYS_OPTIONS = {
  splitKey: HOT_KEYS_COMBINATION_KEY,
  preventDefault: true,
  enableOnFormTags: true,
  enableOnContentEditable: true,
};
