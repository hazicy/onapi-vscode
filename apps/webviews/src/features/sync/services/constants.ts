import i18next from "i18next";

export const TERMINAL_TYPE = {
  /** Client */
  CLIENT: "client",
  /** Web */
  WEB: "web",
} as const;

export const RESPONSE_CODES = {
  /** HTTP status code */
  HTTP_SUCCESS: 200,
  /** Status code */
  SUCCESS: 0,
} as const;

export const RESPONSE_ERROR_CODES = {
  /** Session expired or logged out */
  EXPIRED: 11000,
  /** Token is empty */
  TOKEN_EMPTY: 11090,
  /** Account logged in elsewhere */
  LOGIN_OTHER_PLACE: 11091,
  /** Data conflict */
  DATA_CONFLICTED: 14005,
  /** Cancel send */
  ERR_CANCELED: "ERR_CANCELED",
  /** Force upgrade server shutdown */
  SERVER_CLOSE: 10006,
  /** User not found */
  NOT_FOUND_USER: 11010,
  /** Guest mode, login required */
  GUEST_NEED_LOGIN_SCENE: 14090,
} as const;

export enum PLAN_TIP_ENUM {
  /** When member count > seat count AND project count > limit */
  ERR_TEAM_PLAN_MAX_LIMIT_TIPS = 40000,
  /** When member count > seat count */
  ERR_TEAM_PLAN_MAX_SEAT_LIMIT_TIPS = 40001,
  /** Project count exceeds limit */
  ERR_TEAM_PLAN_MAX_PROJECT_LIMIT_TIPS = 40002,
  /** Members exceed limit */
  ERR_TEAM_PLAN_USER_SEAT_LIMIT = 40003,
  /** Click to unlock popup prompt */
  ERR_TEAM_PLAN_UNLOCK_PROJECT = 40005,
  /** Locked status prompt */
  ERR_TEAM_PLAN_PROJECT_LOCKED_STATUS = 40006,
  /** Free version does not support project recovery */
  ERR_TEAM_PLAN_RECOVER_PROJECT_FREE = 40007,
  /** Project exceeds limit - equal */
  ERR_TEAM_PLAN_PROJECT_SEAT_LIMIT_EQUAL = 40012,
  /** Project exceeds limit - greater */
  ERR_TEAM_PLAN_PROJECT_SEAT_LIMIT_MORE = 40013,
  /** Scheduled task count exceeds - equal */
  ERR_TEAM_PLAN_SCHEDULED_TASK_LIMIT_EQUAL = 40014,
  /** Scheduled task count exceeds - greater */
  ERR_TEAM_PLAN_SCHEDULED_TASK_LIMIT_MORE = 40015,
  /** Invited member exceeds limit prompt */
  ERR_TEAM_INVITE_MEMBER_MORE = 40017,
}

export const PLAN_TIP_CODES = {
  /** Current plan tip code */
  PLAN_TIP: [
    PLAN_TIP_ENUM.ERR_TEAM_PLAN_MAX_LIMIT_TIPS,
    PLAN_TIP_ENUM.ERR_TEAM_PLAN_MAX_SEAT_LIMIT_TIPS,
    PLAN_TIP_ENUM.ERR_TEAM_PLAN_MAX_PROJECT_LIMIT_TIPS,
  ],
  /** Current plan modal code */
  PLAN_MODAL: [
    PLAN_TIP_ENUM.ERR_TEAM_PLAN_USER_SEAT_LIMIT,
    PLAN_TIP_ENUM.ERR_TEAM_PLAN_UNLOCK_PROJECT,
    PLAN_TIP_ENUM.ERR_TEAM_PLAN_PROJECT_LOCKED_STATUS,
    PLAN_TIP_ENUM.ERR_TEAM_PLAN_RECOVER_PROJECT_FREE,
    PLAN_TIP_ENUM.ERR_TEAM_PLAN_PROJECT_SEAT_LIMIT_EQUAL,
    PLAN_TIP_ENUM.ERR_TEAM_PLAN_PROJECT_SEAT_LIMIT_MORE,
    PLAN_TIP_ENUM.ERR_TEAM_PLAN_SCHEDULED_TASK_LIMIT_EQUAL,
    PLAN_TIP_ENUM.ERR_TEAM_PLAN_SCHEDULED_TASK_LIMIT_MORE,
    PLAN_TIP_ENUM.ERR_TEAM_INVITE_MEMBER_MORE,
  ],
};

export const REPLACE_ERROR_BY_CODES: { [key: number]: string } = {
  10001: i18next.t("supplement.cloud_param_err"),
};

export const HTTP_METHODS = {
  POST: "post",
  GET: "get",
} as const;
