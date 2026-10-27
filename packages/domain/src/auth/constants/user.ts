export const WECHAT_TOKEN_STATUS = {
  /** Registered */
  REGISTER: 1,
  /** Not registered */
  UN_REGISTER: -1,
} as const;

export const APIPOST_MACHINE = "onapi-machine";
export const APIPOST_TERMINAL = "onapi-terminal";
export const APIPOST_VERSION = "onapi-version";
export const APIPOST_LANGUAGE = "onapi-language";
export const APIPOST_PLATFORM = "onapi-platform";
export const APIPOST_CLIENT_ID = "onapi-client-id";

export enum AUTHORITY {
  /** Read only */
  READ = 1,
  /** Write */
  WRITE = 2,
  /** Project admin */
  PROJECT = 3,
  /** Team admin */
  TEAM = 4,
}
