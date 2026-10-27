import { ValueOf } from "type-fest";

import { STATUS_CODE } from "@onapi/http-model/constants/common";
import { MIGRATE_RESULT_STATUS } from "@onapi/http-model/import/constants/migrate/index";
import {
  AUTHORITY,
  WECHAT_TOKEN_STATUS,
} from "@onapi/http-model/auth/constants/user";
import { SysConfig } from "@onapi/http-model/settings/types/settings";

export type EmailLoginReq = {
  email: string;
  password: string;
};

export type UserInfo = {
  /**Remaining email modification count */
  ch_email_count: number;
  /**Creation time */
  created_at: string;
  /**Email */
  email: string;
  /**Email verification status */
  email_verify: number;
  /** 1 WeChat bound 0 WeChat not bound */
  had_openid: number;
  /** 1 Password set 0 Password not set */
  had_password: number;
  /**Mobile phone */
  mobile: string | null;
  /**Nickname */
  nick_name: string;
  /**Avatar */
  portrait: string;
  /**User id */
  uid: string;
  /**User identity */
  identity: string;
  /**Whether admin */
  is_admin: STATUS_CODE;
};

export type QrCodeRes = {
  /**QR code image */
  image: string;
  /**QR code URL */
  url: string;
  /**Ticket */
  ticket: string;
  /**QR code expiration time */
  expire_seconds: number;
};

export type LoginRes = {
  /**Token */
  token: string;
  /**Registration status */
  token_status: ValueOf<typeof WECHAT_TOKEN_STATUS>;
  /**Identity */
  identity: string;
};

export type Project = {
  /**Project id */
  project_id: string;
  /**Team id */
  team_id: string;
  /**Project name */
  name: string;
  /**Whether locked */
  is_lock: number;
  /**Whether default project */
  is_default: number;
  /**Whether to enable intelligent description library */
  is_describe_library: 1 | -1;
  /**Force */
  is_force: string;
  /**Logo */
  logo: string;
  /**Introduction */
  intro: string;
  /**Creation time */
  created_at: Date;
  /**Whether deletable */
  can_del: number;
  /**Whether exitable */
  can_quit: number;
  /**Is project admin */
  is_project_admin: number;
  /**Role */
  role: number;
  /**Authority */
  authority: AUTHORITY;
  /**Edit time */
  edited_at: Date;
  /**Migration status */
  upgrade_status: MIGRATE_RESULT_STATUS;
};

export type TeamItem = {
  /**Team name */
  name: string;
  /**Team id */
  team_id: string;
  /**Whether team admin */
  is_team_admin: number;
  /**Whether default project */
  is_default: number;
  /**Whether read-only */
  is_readonly: number;
  /**Creation time */
  created_at: Date;
  /**Project list */
  project: Project[] | null;
  /**Version 7 upgrade to version 8, upgrade status -1 pending migration 1 normal status */
  upgrade_status: number;
};
export type UserSettingReq = {
  configure: Partial<SysConfig>;
};

export type UserListReq = {
  project_id: string;
};

export type UserListRes = {
  /**Role */
  role: number;
  /**Nickname */
  nick_name: string;
  /**Email */
  email: string;
  /**Avatar */
  portrait: string;
  /**Whether admin */
  is_project_admin: number;
  /**User id */
  uid: string;
  /**Whether team admin */
  is_team_admin: number;
};

export type CreateProjectReq = {
  team_id: string;
  name: string;
  intro?: string;
};
