
import { Settings } from "@onapi/domain/testing/types/common";

export type TrashListRes = {
  /**Deletion time */
  deleted_at: string;
  /**Deleted id */
  deleted_id: string;
  /**Deleted */
  deleted_num: string;
  /**Interface type */
  method: string;
  /**Name */
  name: string;
  /**Parent id */
  parentId: string;
  /**Sort order */
  sort: number;
  /**Interface id */
  id: string;
  /**Interface type */
  kind: string;
  /**URL */
  url: string;
  /**Version */
  version: number;
  /**Whether it is a leaf node */
  isLeaf?: boolean;
  /**Deleted user info */
  deleted_user: {
    nick_name: string;
    portrait: string;
    uid: string;
  };
  children?: TrashListRes[];
};

export type TestingReportList = {
  report_id: string;
  complete: any;
  requestList: any[];
  eventAllCount: number;
  report_name: string;
  testingConfig: Settings;
};

/**
 * Test report list
 */
export type TestingReportListRes = {
  project_id: string;
  testing_id: string;
  report_id: string;
  report_name: string;
  env_id: string;
  env_name: string;
  uri: string;
  http_passing_rate: number;
  assert_passing_rate: number;
  start_at: Date;
  end_at: Date;
  created_user: {
    uid: string;
    nick_name: string;
    portrait: string;
  };
  created_at: Date;
};

/**
 * Test report details
 */
