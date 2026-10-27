import { STATUS_CODE } from "@onapi/domain/constants/common";
import {
  CASE_ITEM_TYPE,
  TESTING_TYPE,
} from "@onapi/domain/testing/constants/index";
import { CaseItem, Settings } from "@onapi/domain/testing/types/common";
import { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { ApiSendResponseData } from "@onapi/domain/requests/types/send";

export type CaseAddMenu = {
  /**Icon */
  icon: string;
  /**Name */
  name: string;
  /**tag */
  tag: string;
  /**Type */
  type: CASE_ITEM_TYPE;
  /**Value */
  value: number;
  /**Color */
  color: string;
  /**Tooltip */
  tip?: string;
};

/**Test case list */
export type TestingData = {
  /**Project ID */
  project_id: string;
  parentId: string;
  /**Test case ID */
  testing_id: string;
  /**Parent name */
  parent_name: string;
  /**Test case name */
  name: string;
  /**Test case type */
  testing_type: TESTING_TYPE;
  /**Version */
  version: number;
  /**Sort order */
  sort: number;
  /**Created at */
  created_at: Date;
  /**Created by */
  created_user: User;
  /**Created at */
  updated_at: Date;
  /**Updated by */
  updated_user: User;
  /**Last executor */
  last_report_user: User;
  /**Last execution time */
  last_report_at: Date;
  // Whether modified
  is_changed?: STATUS_CODE;
  // Whether conflicted
  is_conflicted?: STATUS_CODE;
  // Whether forced
  is_force?: STATUS_CODE;
  // Whether deleted
  is_deleted?: STATUS_CODE;
  /**Directory display name */
  display_request_directory: string;
  /**Test case reference relationship, checks for circular references */
  case_references: string[];
  /**API IDs used by current case (including APIs, API cases, referenced cases) */
  references_ids: string[];
};

/**Test case details */
export type TestingDetailData = {
  settings: Settings;
  event_list: CaseItem[];
} & TestingData;

export type EventData = {
  settings: Settings;
  event_list: EventItem[];
};

export type EventItem = {
  event_id: string;
  test_id: string;
  project_id: string;
  type: CASE_ITEM_TYPE;
  enabled: STATUS_CODE;
  sort: number;
  data: ApiDetailsData;
  parent_event_id: string;
  /**Whether bidirectional sync */
  auto_sync?: boolean;
};

export type User = {
  uid: string;
  nick_name: string;
  portrait: string;
};

/**
 * Continuous integration list
 */
export type IntegrationItem = {
  name: string;
  env: string;
  count: number;
};

/**
 * Test data list item
 */
export type TestingDataItem = {
  name: string;
  created_at: string;
  iterates_id: string;
  data: { [env_id: string]: Array<object | string> };
};

/**
 * Test data list
 */
export type TestingDataListItem = {
  project_id: string;
  testing_id: string;
  iterates_id: string;
  name: string;
  created_at: string;
  data_list: { env_id: string; data: any[] }[];
};
export type TestingDataList = TestingDataListItem[];

export interface TestingSendingData {
  /**Send status */
  sendStatus: "initial" | "sending" | "sendError" | "sendOver";
  /**Send result */
  requestList: any[];
  /**Completion info */
  complete: any;
}

export type RuntimeResponse = Pick<
  ApiSendResponseData,
  "console" | "request" | "response" | "assertions"
>;
