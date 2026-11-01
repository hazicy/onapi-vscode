import { STATUS_CODE } from "@onapi/domain/constants/common";

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
